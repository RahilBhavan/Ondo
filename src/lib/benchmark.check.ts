/** Self-check for the benchmark row mapper. Run: npx tsx src/lib/benchmark.check.ts */
import assert from 'node:assert/strict';
import { DEFILLAMA_SLUGS, latestStablecoinUsd, mapBenchmarkRow, STABLECOIN_IDS, withOnchainOndo } from './benchmark';
import { LAST_GOOD } from './lastGood';

const asOf = '2026-09-24T12:00:00.000Z';
const [ondo, ustb, tbill, buidl] = LAST_GOOD.competitorBenchmark;

// Stored rows: four products, BUIDL replaces BENJI, each with a DefiLlama citation.
assert.deepEqual(
  LAST_GOOD.competitorBenchmark.map((r) => r.protocol),
  ['nexus', 'superstate', 'openeden', 'blackrock-buidl']
);
for (const r of LAST_GOOD.competitorBenchmark) {
  // Ondo's stored row is the on-chain total (withOnchainOndo); the others cite DefiLlama.
  if (r.protocol !== 'nexus') assert.ok(r.source.startsWith('https://defillama.com/'), r.source);
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
const chain = LAST_GOOD.chainTvl.map((r) => ({ ...r, dataSource: 'live' as const, asOf }));
const chainTotal = chain.reduce((s, r) => s + r.tvlUsd, 0);
const swapped = withOnchainOndo([rwa, live], chain);
assert.equal(swapped[0].tvlUsd, chainTotal);
assert.equal(swapped[0].dataSource, 'live');
assert.equal(swapped[0].chainCount, 14);
assert.equal(swapped[1], live);
// Cached chain rows still give the on-chain total, labeled estimated with the cached date.
const partial = [{ ...chain[0], dataSource: 'cached' as const, asOf: '2026-01-01T00:00:00Z' }, ...chain.slice(1)];
const mixedOndo = withOnchainOndo([rwa, live], partial)[0];
assert.equal(mixedOndo.dataSource, 'estimated');
assert.equal(mixedOndo.asOf, '2026-01-01T00:00:00Z');
assert.equal(mixedOndo.tvlUsd, chainTotal);
assert.equal(withOnchainOndo([rwa], [])[0], rwa);

// Stablecoin series: last point wins; a bad shape throws so the caller falls back.
assert.equal(latestStablecoinUsd([{ totalCirculatingUSD: { peggedUSD: 1 } }, { totalCirculatingUSD: { peggedUSD: 2_165_301_032.01 } }]), 2_165_301_032.01);
for (const bad of [[], {}, null, [{}], [{ totalCirculatingUSD: { peggedUSD: '5' } }]]) {
  assert.throws(() => latestStablecoinUsd(bad), /stablecoin series/);
}
const buidlLive = mapBenchmarkRow(buidl, 2_165_301_032, asOf, STABLECOIN_IDS['blackrock-buidl']!.page);
assert.equal(buidlLive.source, 'https://defillama.com/stablecoin/blackrock-usd-buidl');
assert.equal(buidlLive.dataSource, 'live');

console.log('benchmark check ok');
