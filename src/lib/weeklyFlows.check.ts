/** Self-check for the weekly flow series math. Run: npx --yes tsx src/lib/weeklyFlows.check.ts */
import assert from 'node:assert/strict';
import { MOCK_DATA } from './mockData';
import { fourWeekStats, growth12w, isCompleteWeek, mondayOf, weeklySeries } from './flowStats';
import type { WeeklyFlow } from './types';

const row: WeeklyFlow = {
  week: '2026-03-30',
  token: 'OUSG',
  mintVolumeUsd: 12500000.5,
  redeemVolumeUsd: 20000000,
  netFlowUsd: -7499999.5,
  mintCount: 9,
  redeemCount: 4,
  uniqueMinters: 6,
  uniqueRedeemers: 3,
  uniqueWallets: 8,
  dataSource: 'live',
  asOf: '2026-04-09T00:00:00.000Z',
  source: 'https://eth.blockscout.com/address/0x93358db73B6cd4b98D89c8F5f230E81a95c2643a?tab=logs',
};

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

// Stale fetch: asOf is when the data was read, not the wall clock. Weeks after it are
// neither zero-filled nor complete, so the headline week keeps its real volume.
const stale = ['2026-08-10', '2026-08-17', '2026-08-24'].map((week) => ({
  ...row,
  week,
  token: 'USDY' as const,
  mintVolumeUsd: 5_000_000,
  asOf: '2026-08-27T00:00:00Z',
}));
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
