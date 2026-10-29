/**
 * Keeps the README's snapshot figures in step with src/data/*.json.
 *
 * Two kinds of marker in README.md are rewritten from the committed snapshots:
 *   <!--asof:KEY-->date<!--/asof-->        a UTC date; KEY is flows, supply, rates or lastGood
 *   <!--snapshot:NAME-->...<!--/snapshot--> a generated block; NAME is results or counts
 * Everything else in the README is hand-written and left alone. Run `npm run sync:readme` after a data
 * refresh; readmeSync.check.ts fails when the README has drifted from the snapshots.
 */

import issuance from '../data/issuance.json';
import { LAST_GOOD } from './lastGood';
import { formatTrillions } from './format';
import { issuanceSummary, logVsSupply, SNAPSHOT } from './issuance';

const utcDate = (iso: string | null): string => {
  if (!iso) throw new Error('snapshot has no timestamp');
  return new Date(iso).toISOString().slice(0, 10);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMonthYear = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** $420.5B, $748.5M, −$23.7B (U+2212 for negatives, as the README has always written them). */
const usd = (v: number): string => {
  const a = Math.abs(v);
  const s = a >= 1e9 ? `$${(a / 1e9).toFixed(1)}B` : `$${(a / 1e6).toFixed(1)}M`;
  return v < 0 ? `−${s}` : s;
};

const asOfDates = (): Record<string, string> => ({
  flows: utcDate(SNAPSHOT.flowsAsOf),
  supply: utcDate(SNAPSHOT.supplyAsOf),
  rates: utcDate(SNAPSHOT.ratesAsOf),
  lastGood: utcDate(LAST_GOOD.generatedAt),
});

function resultsBlock(): string {
  const s = issuanceSummary();
  const sum = (k: 'mintUsd' | 'redeemUsd' | 'netUsd') => s.totals.reduce((a, t) => a + t[k], 0);
  const rows = s.totals.map((t) => `| ${t.asset} | ${usd(t.mintUsd)} | ${usd(t.redeemUsd)} | ${usd(t.netUsd)} |`);
  return [
    `From the dated snapshot in \`src/data/issuance.json\` (event logs read ${utcDate(s.asOf)} UTC, Ethereum only, weeks of ${dayMonthYear(s.startWeek)} through ${dayMonthYear(s.lastWeek)}):`,
    '',
    '| Asset | Mints | Redemptions | Net |',
    '|-------|------:|------------:|----:|',
    ...rows,
    `| **Five issuers** | **${usd(sum('mintUsd'))}** | **${usd(sum('redeemUsd'))}** | **${usd(sum('netUsd'))}** |`,
  ].join('\n');
}

function countsBlock(): string {
  const s = issuanceSummary();
  const audit = issuance.audit as Record<string, number>;
  const events = Object.values(audit).reduce((a, n) => a + n, 0);
  const usdc = (audit['USDC:mint'] ?? 0) + (audit['USDC:redeem'] ?? 0);
  return [
    `- The snapshot holds ${events.toLocaleString('en-US')} decoded event logs (the \`audit\` counts in \`src/data/issuance.json\`). USDC is ${(usdc / 1e6).toFixed(2)}M of them.`,
    `- The five issuers total about $1T of mints and redemptions: ${formatTrillions(s.grossUsd)} after removing ${usd(s.cctpBridgedUsd)} of Circle CCTP transfers, ${formatTrillions(s.grossWithCctpUsd)} if they were counted (\`grossUsd\` and \`grossWithCctpUsd\` in \`src/lib/issuance.ts\`). The tracker excludes CCTP because moving USDC between chains is not new money. It also excludes Paxos's mistaken 300 trillion PYUSD mint and its burn on 2025-10-15.`,
  ].join('\n');
}

function reconcileBlock(): string {
  const pct = (a: 'USDC' | 'PYUSD') => Math.ceil(logVsSupply(a).diff * 100);
  return `- Ethereum log-derived net issuance matched DefiLlama's Ethereum supply change within ${pct('USDC')}% for USDC and ${pct('PYUSD')}% for PYUSD (\`src/lib/issuance.check.ts\`, checked against the snapshot read <!--asof:flows-->${asOfDates().flows}<!--/asof-->).`;
}

const BLOCKS: Record<string, () => string> = { results: resultsBlock, counts: countsBlock, reconcile: reconcileBlock };

/** Returns the README with every marker rewritten; throws if a marker names something unknown or none is found. */
export function renderReadme(readme: string): string {
  const dates = asOfDates();
  let found = 0;
  const withDates = readme.replace(/<!--asof:(\w+)-->[^<]*<!--\/asof-->/g, (_m, key: string) => {
    if (!dates[key]) throw new Error(`README: unknown asof key "${key}"`);
    found++;
    return `<!--asof:${key}-->${dates[key]}<!--/asof-->`;
  });
  const out = withDates.replace(/<!--snapshot:(\w+)-->[\s\S]*?<!--\/snapshot-->/g, (_m, name: string) => {
    const block = BLOCKS[name];
    if (!block) throw new Error(`README: unknown snapshot block "${name}"`);
    found++;
    return `<!--snapshot:${name}-->\n\n${block()}\n\n<!--/snapshot-->`;
  });
  if (!found) throw new Error('README: no asof or snapshot markers found');
  return out;
}
