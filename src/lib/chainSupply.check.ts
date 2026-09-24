/** Self-check for chain supply parsing and fallback. No network. Run: npx --yes tsx src/lib/chainSupply.check.ts */
import assert from 'node:assert/strict';
import { buildRows, fromBaseUnits, stellarSupply, SUPPLY_SOURCES, toLiquidityCells, xrplSupply } from './chainSupply';
import { MOCK_DATA } from './mockData';

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// Base units per family: EVM + Noble 18 decimals, Solana/Sui/Aptos 6.
close(fromBaseUnits(BigInt('1038672623980000000000000000'), 18), 1_038_672_623.98);
close(fromBaseUnits('5612589035055497821270000', 18), 5_612_589.035055497);
close(fromBaseUnits('157215505095250', 6), 157_215_505.09525);
close(fromBaseUnits('12773284723262', 6), 12_773_284.723262);
assert.equal(fromBaseUnits('0', 18), 0);

// Stellar: sum of decimal-string balances in every location (unauthorized included); missing fields count as 0.
close(
  stellarSupply({
    balances: { authorized: '461624466.4277304', authorized_to_maintain_liabilities: '0.0000000', unauthorized: '5.0' },
    contracts_amount: '5877401.2436123',
    liquidity_pools_amount: '284.0253335',
    claimable_balances_amount: '0.0000000',
  }),
  467_502_156.6966762
);
close(stellarSupply({ balances: { authorized: '10.5' } }), 10.5);
close(stellarSupply({ balances: { unauthorized: '2.5' }, amount: '999' }), 2.5);
assert.throws(() => stellarSupply({ balances: { authorized: 'x' } }), /bad amount/);

// XRPL: obligations are already token units; absent currency = nothing outstanding.
const CUR = '4F55534700000000000000000000000000000000';
close(xrplSupply({ status: 'success', obligations: { [CUR]: '1639899.441472341' } }, CUR), 1_639_899.441472341);
assert.equal(xrplSupply({ status: 'success' }, CUR), 0);
assert.throws(() => xrplSupply({ status: 'error' }, CUR), /xrpl status/);

// Every source has a mock fallback row, and 13 chains are covered.
const mock = MOCK_DATA.chainBreakdown;
assert.equal(mock.length, SUPPLY_SOURCES.length);
assert.equal(new Set(SUPPLY_SOURCES.map((s) => s.chain)).size, 13);
const mockTotal = mock.reduce((s, r) => s + r.tvlUsd, 0);
assert.ok(mockTotal > 2.5e9 && mockTotal < 2.7e9, `mock total ${mockTotal}`);
close(MOCK_DATA.metrics.totalTvlUsd, mockTotal, 1);

const prices = { OUSG: 116.662365, USDY: 1.14730001, asOf: '2026-09-24T00:00:00Z', source: 'oracle' };
const asOf = '2026-09-24T12:00:00Z';
const sumPct = (rows: { pctOfTotal: number }[]) => rows.reduce((s, r) => s + r.pctOfTotal, 0);

// All live.
const allOk = SUPPLY_SOURCES.map((_, i): PromiseSettledResult<number> => ({ status: 'fulfilled', value: (i + 1) * 1000 }));
const live = buildRows(SUPPLY_SOURCES, allOk, prices, mock, asOf);
assert.ok(live.every((r) => r.dataSource === 'live' && r.asOf === asOf));
close(live[0].tvlUsd, 1000 * prices[SUPPLY_SOURCES[0].token]);
close(sumPct(live), 100);

// One failed read: that row is its mock value labeled mocked, the rest stay live.
const oneFail = allOk.map((r, i): PromiseSettledResult<number> => (i === 5 ? { status: 'rejected', reason: new Error('timeout') } : r));
const warn = console.warn;
console.warn = () => {};
const mixed = buildRows(SUPPLY_SOURCES, oneFail, prices, mock, asOf);
console.warn = warn;
assert.equal(mixed[5].dataSource, 'mocked');
assert.equal(mixed[5].tvlUsd, mock.find((m) => m.chain === SUPPLY_SOURCES[5].chain && m.token === SUPPLY_SOURCES[5].token)!.tvlUsd);
assert.equal(mixed.filter((r) => r.dataSource === 'live').length, SUPPLY_SOURCES.length - 1);
close(sumPct(mixed), 100);

// Failed price: every row mocked.
const noPrice = buildRows(SUPPLY_SOURCES, allOk, null, mock, asOf);
assert.ok(noPrice.every((r) => r.dataSource === 'mocked'));
close(sumPct(noPrice), 100);

// Heatmap cells mirror the rows, issuer = token.
const cells = toLiquidityCells(mixed);
assert.equal(cells.length, mixed.length);
assert.equal(cells[1].issuer, mixed[1].token);
assert.equal(cells[5].dataSource, 'mocked');

console.log(`chainSupply check ok (mock total $${(mockTotal / 1e9).toFixed(3)}B, ${SUPPLY_SOURCES.length} rows)`);
