/** Self-check for the Dune row mapper. Run: npx --yes tsx src/lib/weeklyFlows.check.ts */
import assert from 'node:assert/strict';
import { mapDuneRow } from './weeklyFlows';
import { MOCK_DATA } from './mockData';
import { growth12w, isCompleteWeek, mondayOf, weeklySeries } from './flowStats';

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

console.log(`weeklyFlows check ok (${mock.length} mock rows)`);
