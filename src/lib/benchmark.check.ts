/** Self-check for the benchmark row mapper. Run: npx --yes tsx src/lib/benchmark.check.ts */
import assert from 'node:assert/strict';
import { DEFILLAMA_SLUGS, mapBenchmarkRow, withOnchainOndo } from './benchmark';
import { MOCK_DATA } from './mockData';

const asOf = '2026-09-24T12:00:00.000Z';
const [ondo, ustb, tbill, buidl] = MOCK_DATA.competitorBenchmark;

// Mock rows: four products, BUIDL replaces BENJI, every row mocked with a DefiLlama citation.
assert.deepEqual(
  MOCK_DATA.competitorBenchmark.map((r) => r.protocol),
  ['nexus', 'superstate', 'openeden', 'blackrock-buidl']
);
for (const r of MOCK_DATA.competitorBenchmark) {
  assert.equal(r.dataSource, 'mocked');
  assert.ok(r.source.startsWith(`https://defillama.com/protocol/${DEFILLAMA_SLUGS[r.protocol]}`), r.source);
  assert.ok(r.tvlUsd > 0);
  // A redemption claim needs a citation; only "Not disclosed" may go without one.
  assert.ok(r.redemptionSpeed === 'Not disclosed' || r.redemptionSource, r.protocol);
  assert.ok(r.chainCount === null || r.chainSource, r.protocol);
}

// Live row: TVL, label, asOf and source change; cited static fields stay.
const rwa = mapBenchmarkRow(ondo, 2_560_085_819.29, asOf);
assert.equal(rwa.tvlUsd, 2_560_085_819.29);
assert.equal(rwa.dataSource, 'live');
assert.equal(rwa.asOf, asOf);
assert.equal(rwa.source, 'https://defillama.com/protocol/ondo-yield-assets');
assert.equal(rwa.chainCount, 14);
assert.equal(rwa.chainSource, ondo.chainSource);
assert.equal(rwa.redemptionSpeed, ondo.redemptionSpeed);

// Chain counts always cite issuer docs, never DefiLlama.
const live = mapBenchmarkRow(ustb, 549_663_644, asOf);
assert.equal(live.chainCount, 3);
assert.equal(live.chainSource, 'https://docs.superstate.com/investors/tokenized-funds/available-funds/invesco-ustb');
assert.equal(live.source, 'https://defillama.com/protocol/invesco-ustb');
assert.equal(mapBenchmarkRow(tbill, 1, asOf).chainCount, 3);
assert.equal(mapBenchmarkRow(buidl, 1, asOf).chainCount, null);

// Bad TVL throws so the caller falls back to the mock row.
for (const bad of [0, -5, NaN, '123', null, { tvl: 1 }]) {
  assert.throws(() => mapBenchmarkRow(ondo, bad, asOf), /bad tvl/);
}

// Ondo row takes the on-chain total only when every chain row is live; competitors untouched.
const chain = MOCK_DATA.chainBreakdown.map((r) => ({ ...r, dataSource: 'live' as const, asOf }));
const chainTotal = chain.reduce((s, r) => s + r.tvlUsd, 0);
const swapped = withOnchainOndo([rwa, live], chain);
assert.equal(swapped[0].tvlUsd, chainTotal);
assert.equal(swapped[0].dataSource, 'live');
assert.equal(swapped[0].chainCount, 14);
assert.equal(swapped[1], live);
const partial = [{ ...chain[0], dataSource: 'mocked' as const }, ...chain.slice(1)];
assert.equal(withOnchainOndo([rwa, live], partial)[0], rwa);
assert.equal(withOnchainOndo([rwa], [])[0], rwa);

console.log('benchmark check ok');
