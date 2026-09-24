/** Self-check for the benchmark row mapper. Run: npx --yes tsx src/lib/benchmark.check.ts */
import assert from 'node:assert/strict';
import { DEFILLAMA_SLUGS, mapBenchmarkRow } from './benchmark';
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

// RWA slug: currentChainTvls empty, `chains` is a placeholder, so the cited static count stays.
const rwa = mapBenchmarkRow(ondo, 2_560_085_819.29, { chains: ['Ethereum'], currentChainTvls: {} }, asOf);
assert.equal(rwa.tvlUsd, 2_560_085_819.29);
assert.equal(rwa.dataSource, 'live');
assert.equal(rwa.asOf, asOf);
assert.equal(rwa.source, 'https://defillama.com/protocol/ondo-yield-assets');
assert.equal(rwa.chainCount, 14);
assert.equal(rwa.chainSource, ondo.chainSource);
assert.equal(rwa.redemptionSpeed, ondo.redemptionSpeed);

// Per-chain TVL tracked: chain count comes from DefiLlama.
const tracked = mapBenchmarkRow(
  ustb,
  549_663_644,
  { chains: ['Ethereum', 'Solana'], currentChainTvls: { Ethereum: 1, Solana: 2 } },
  asOf
);
assert.equal(tracked.chainCount, 2);
assert.equal(tracked.chainSource, 'https://defillama.com/protocol/invesco-ustb');

// Missing metadata keeps the static count; null static count stays null.
assert.equal(mapBenchmarkRow(tbill, 1, null, asOf).chainCount, 3);
assert.equal(mapBenchmarkRow(buidl, 1, undefined, asOf).chainCount, null);

// Bad TVL throws so the caller falls back to the mock row.
for (const bad of [0, -5, NaN, '123', null, { tvl: 1 }]) {
  assert.throws(() => mapBenchmarkRow(ondo, bad, null, asOf), /bad tvl/);
}

console.log('benchmark check ok');
