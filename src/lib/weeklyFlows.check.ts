/** Self-check for the Dune row mapper. Run: npx --yes tsx src/lib/weeklyFlows.check.ts */
import assert from 'node:assert/strict';
import { mapDuneRow } from './weeklyFlows';
import { MOCK_DATA } from './mockData';
import { fourWeekStats, growth12w, isCompleteWeek, mondayOf, weeklySeries } from './flowStats';

const meta = { asOf: '2026-04-09T00:00:00.000Z', source: 'https://dune.com/queries/1' };

const row = mapDuneRow(
  {
    week: '2026-03-30 00:00:00.000 UTC',
    token: 'OUSG',
    mint_volume_usd: '12500000.5',
    redeem_volume_usd: 20000000,
    net_flow_usd: -7499999.5,
    mint_count: 9,
    redeem_count: '4',
    unique_minters: 6,
    unique_redeemers: 3,
    unique_wallets: 8,
  },
  meta
);
assert.equal(row.week, '2026-03-30');
assert.equal(row.token, 'OUSG');
assert.equal(row.mintVolumeUsd, 12500000.5);
assert.equal(row.netFlowUsd, -7499999.5);
assert.equal(row.redeemCount, 4);
assert.equal(row.uniqueWallets, 8);
assert.equal(row.dataSource, 'live');
assert.equal(row.source, meta.source);

assert.throws(() => mapDuneRow({ week: 'nope', token: 'OUSG' }, meta));
assert.throws(() => mapDuneRow({ week: '2026-04-01', token: 'OUSG' }, meta), /bad week/);
assert.throws(() => mapDuneRow({ week: '2026-03-30', token: 'BUIDL' }, meta));
assert.throws(() => mapDuneRow({ week: '2026-03-30', token: 'USDY', mint_volume_usd: 'x' }, meta));

// Mock series: deterministic shape, Monday weeks, both tokens, wallets never exceed minters + redeemers.
const mock = MOCK_DATA.weeklyFlows;
assert.equal(mock.length, 156);
for (const f of mock) {
  assert.equal(new Date(`${f.week}T00:00:00Z`).getUTCDay(), 1, `${f.week} is not a Monday`);
  assert.equal(f.netFlowUsd, f.mintVolumeUsd - f.redeemVolumeUsd);
  assert.ok(f.uniqueWallets <= f.uniqueMinters + f.uniqueRedeemers);
  assert.equal(f.dataSource, 'mocked');
}
assert.ok(mock.some((f) => f.netFlowUsd < 0), 'expected some negative net flow weeks');

// Week math (UTC Mondays).
assert.equal(mondayOf('2026-04-09'), '2026-04-06');
assert.equal(mondayOf('2026-04-06'), '2026-04-06');
assert.equal(mondayOf('2026-04-05T23:59:00Z'), '2026-03-30');
assert.equal(isCompleteWeek('2026-03-30', '2026-04-09'), true);
assert.equal(isCompleteWeek('2026-04-06', '2026-04-09'), false);

// Gap filling: missing weeks become zero rows, through the asOf week.
const sparse = [
  { ...row, week: '2026-03-02', asOf: '2026-03-25T10:00:00Z' },
  { ...row, week: '2026-03-16', asOf: '2026-03-25T10:00:00Z' },
];
const filled = weeklySeries(sparse, 'OUSG');
assert.deepEqual(filled.map((r) => r.week), ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23']);
assert.equal(filled[1].mintVolumeUsd, 0);
assert.equal(filled[1].uniqueWallets, 0);
assert.equal(weeklySeries(sparse, 'USDY').length, 0);

// Growth: 24 complete weeks, prior 12 at 1.0M total, last 12 at 1.5M total, plus a partial week ignored.
const flat = Array.from({ length: 25 }, (_, i) => {
  const week = new Date(Date.UTC(2025, 0, 6 + i * 7)).toISOString().slice(0, 10);
  const v = i === 24 ? 99e6 : i >= 12 ? 1_000_000 : 1_000_000 / 1.5;
  return { ...row, week, mintVolumeUsd: v / 2, redeemVolumeUsd: v / 2, asOf: `${week}T12:00:00Z` };
});
const g = growth12w(flat, flat[24].asOf);
assert.ok(g !== null && Math.abs(g - 0.5) < 1e-9, `growth ${g}`);
assert.equal(growth12w(flat.slice(1), flat[24].asOf), null);

// Stale Dune execution: asOf is the execution end, not the wall clock. Weeks after it are
// neither zero-filled nor complete, so the headline week keeps its real volume.
const staleMeta = { asOf: '2026-08-27T00:00:00Z', source: meta.source };
const stale = ['2026-08-10', '2026-08-17', '2026-08-24'].map((week) =>
  mapDuneRow({ week, token: 'USDY', mint_volume_usd: 5_000_000 }, staleMeta)
);
const staleSeries = weeklySeries(stale, 'USDY');
assert.deepEqual(staleSeries.map((r) => r.week), ['2026-08-10', '2026-08-17', '2026-08-24']);
const staleLast = [...staleSeries].reverse().find((r) => isCompleteWeek(r.week, r.asOf));
assert.equal(staleLast?.week, '2026-08-17');
assert.ok(staleLast && staleLast.mintVolumeUsd > 0);

// 4-week stats: 9 complete OUSG weeks + 1 partial, USDY with a gap week. Window = last 4 complete.
const fwAsOf = '2026-03-11T00:00:00Z'; // week of 2026-03-09 is partial
const fw = [
  ...Array.from({ length: 10 }, (_, i) => {
    const week = new Date(Date.UTC(2026, 0, 5 + i * 7)).toISOString().slice(0, 10);
    const v = i === 9 ? 99e6 : i >= 5 ? 200 : 100; // weeks 1-4 prior (100), 5-8 recent (200)
    return { ...row, week, mintVolumeUsd: v, redeemVolumeUsd: 0, netFlowUsd: v, mintCount: 1, redeemCount: 1, asOf: fwAsOf };
  }),
  { ...row, token: 'USDY' as const, week: '2026-02-09', mintVolumeUsd: 0, redeemVolumeUsd: 50, netFlowUsd: -50, mintCount: 0, redeemCount: 2, asOf: fwAsOf },
  { ...row, token: 'USDY' as const, week: '2026-02-23', mintVolumeUsd: 30, redeemVolumeUsd: 0, netFlowUsd: 30, mintCount: 1, redeemCount: 0, asOf: fwAsOf },
];
const s4 = fourWeekStats(fw);
assert.equal(s4.volumeUsd, 4 * 200 + 50 + 30);
assert.equal(s4.netFlowUsd, 4 * 200 - 50 + 30);
assert.equal(s4.txCount, 4 * 2 + 2 + 1);
assert.equal(s4.avgTxSizeUsd, 880 / 11);
assert.equal(s4.priorVolumeUsd, 4 * 100);
assert.ok(s4.volumeTrend !== null && Math.abs(s4.volumeTrend - (880 / 400 - 1)) < 1e-9);
const empty = fourWeekStats([]);
assert.equal(empty.avgTxSizeUsd, null);
assert.equal(empty.volumeTrend, null);

console.log(`weeklyFlows check ok (${mock.length} mock rows)`);
