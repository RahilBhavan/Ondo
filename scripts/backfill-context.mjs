/**
 * Context series for the flows tracker. Writes src/data/supply-by-chain.json and src/data/rates.json.
 *  - DefiLlama stablecoins API (keyless): daily circulating supply per chain for USDT (1), USDC (2), PYUSD (120).
 *    Sampled to Monday 00:00 UTC; weekly net change = supply(Monday) - supply(previous Monday).
 *  - FRED (keyless CSV): federal funds target range upper bound (DFEDTARU) and effective rate (DFF), daily.
 * Run: node scripts/backfill-context.mjs
 */
import { writeFileSync } from 'node:fs';

const START = Date.parse('2022-12-26T00:00:00Z') / 1000; // Monday before 2023-01-01
const COINS = { USDT: 1, USDC: 2, PYUSD: 120 };

const monday = (sec) => {
  const d = new Date(sec * 1000);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
};

const get = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
};

const supply = [];
for (const [asset, id] of Object.entries(COINS)) {
  const d = await (await get(`https://stablecoins.llama.fi/stablecoin/${id}`)).json();
  for (const [chain, v] of Object.entries(d.chainBalances)) {
    // keep the last observation of each Monday-dated day (daily data: exactly one per day)
    const byWeek = new Map();
    for (const t of v.tokens) {
      if (t.date < START) continue;
      const day = new Date(t.date * 1000);
      if (day.getUTCDay() !== 1) continue; // Mondays only
      byWeek.set(monday(t.date), t.circulating?.peggedUSD ?? null);
    }
    for (const [week, usd] of byWeek) if (usd != null) supply.push({ asset, chain, week, supplyUsd: Math.round(usd) });
  }
  console.log(asset, 'chains', Object.keys(d.chainBalances).length);
}
supply.sort((a, b) => a.week.localeCompare(b.week) || a.asset.localeCompare(b.asset) || a.chain.localeCompare(b.chain));
writeFileSync(new URL('../src/data/supply-by-chain.json', import.meta.url), JSON.stringify({ asOf: new Date().toISOString(), source: 'DefiLlama stablecoins API (stablecoins.llama.fi), Monday observations', rows: supply }));

const fred = async (id) => {
  const text = await (await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=2022-12-01`)).text();
  return text.trim().split('\n').slice(1).map((l) => l.split(',')).filter(([, v]) => v && v !== '.').map(([date, v]) => ({ date, value: Number(v) }));
};
const [upper, dff] = await Promise.all([fred('DFEDTARU'), fred('DFF')]);
// Target-change dates: days where the upper bound differs from the previous day.
const changes = [];
for (let i = 1; i < upper.length; i++) if (upper[i].value !== upper[i - 1].value) changes.push({ date: upper[i].date, from: upper[i - 1].value, to: upper[i].value });
writeFileSync(new URL('../src/data/rates.json', import.meta.url), JSON.stringify({ asOf: new Date().toISOString(), source: 'FRED DFEDTARU / DFF', changes, upper, effective: dff }));
console.log('supply rows', supply.length, 'rate changes', changes);
