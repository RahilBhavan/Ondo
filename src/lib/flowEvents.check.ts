/** Self-check for log decoding and weekly aggregation. No network. Run: npx --yes tsx src/lib/flowEvents.check.ts */
import assert from 'node:assert/strict';
import { aggregateWeekly, decodeFlowLog, topic0, type BlockscoutLog } from './flowEvents';
import type { FlowEvent } from './types';

// topic0 of our ABI matches the constants in queries/mint_redeem_volume.sql and the legacy selectors.
assert.equal(topic0('Subscription'), '0x5c88561b046569d4773b016d48f154d22685738bfb692bb0f8478ec2ef36b79f');
assert.equal(topic0('Redemption'), '0x7023b7bcd020761014c9e1590603f4effceabc102cf0b8023c3f2b14db9ffb6e');
assert.equal(topic0('InstantMintOUSG'), '0xa7e0c0d5dafad919bcce949a69b87d1e7113191e82bdff004aee60113360e8a1');
assert.equal(topic0('InstantMintRebasingOUSG'), '0xbc4f206b2e28efbd091a337f9f58c4c34b66b7d37635c1dd3988c5b37a26ea03');
assert.equal(topic0('InstantRedemptionOUSG'), '0xf471bbdc6d946fd3498685d6ca86100e70e0c5bc0f4989de3dd973ed7400b54e');
assert.equal(topic0('InstantRedemptionRebasingOUSG'), '0xd3ed0395236352d610099f7cc105ececd13c154191e7df31ebd3ff4d573743f4');

// Real logs from eth.blockscout.com/api/v2/addresses/<InstantManager>/logs (fetched 2026-09-24).
const ousgSubscription: BlockscoutLog = {
  topics: [
    '0x5c88561b046569d4773b016d48f154d22685738bfb692bb0f8478ec2ef36b79f',
    '0x0000000000000000000000003d85c41e1a24a970a93436bf6379f53317272d6c',
    '0x4f55534700000000f8ca7d9ae2ee17a200000000000000000000000000000000',
    null,
  ],
  data: '0x00000000000000000000000000000000000000000000000273b69d67a4ee84bf000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000012a05f20000000000000000000000000000000000000000000000010f0cf064dd592000000000000000000000000000000000000000000000000000000000000000000000',
  block_number: 22190948,
  block_timestamp: '2025-04-03T21:03:59.000000Z',
  index: 118,
  transaction_hash: '0xe6de9837e9a26af4c2098fe54853bb39051f14d078505fd1a792bb2d98048878',
};
const usdyRedemption: BlockscoutLog = {
  topics: [
    '0x7023b7bcd020761014c9e1590603f4effceabc102cf0b8023c3f2b14db9ffb6e',
    '0x000000000000000000000000db63429afd672b774a1c99b9e8e78229c676c878',
    '0x55534459000000009310097834e2c7af00000000000000000000000000000000',
    null,
  ],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000001109000000000000000000000000000000000000000000000000000f7e4f0bdcacac000000000000000000000000000000000000000000000000000000000000000000',
  block_number: 24020689,
  block_timestamp: '2025-12-15T21:28:47.000000Z',
  index: 373,
  transaction_hash: '0xf8d7d4e011a774d261f8efb1c53f9a837e299ccbc8a6e21cc5939fc2f2e3af31',
};
const legacyMint: BlockscoutLog = {
  topics: [
    '0xa7e0c0d5dafad919bcce949a69b87d1e7113191e82bdff004aee60113360e8a1',
    '0x0000000000000000000000007fbe0de6ffa86f4b9528aa27029595429b0c74a9',
    null,
    null,
  ],
  data: '0x00000000000000000000000000000000000000000000000000000002540be4000000000000000000000000000000000000000000000000051dac73da6bb53b55',
  block_number: 19741148,
  block_timestamp: '2024-04-26T17:55:47.000000Z',
  index: 115,
  transaction_hash: '0x8cd66176f27281fe6de8fc5eb64a6b0613a062e4df656862a338ab3504747b86',
};
const legacyRebasingRedeem: BlockscoutLog = {
  topics: [
    '0xd3ed0395236352d610099f7cc105ececd13c154191e7df31ebd3ff4d573743f4',
    '0x0000000000000000000000007fbe0de6ffa86f4b9528aa27029595429b0c74a9',
    null,
    null,
  ],
  data: '0x000000000000000000000000000000000000000000000a968163f0a57b4000000000000000000000000000000000000000000000000000199613cf363913fe780000000000000000000000000000000000000000000000000000000ba43b73ff',
  block_number: 19727478,
  block_timestamp: '2024-04-24T20:01:23.000000Z',
  index: 236,
  transaction_hash: '0xf780b59edf89d28804caa81b64af0d63a98450a5c352d090efa436b72b7ed1b0',
};

assert.deepEqual(decodeFlowLog(ousgSubscription, 'OUSG'), {
  token: 'OUSG',
  kind: 'mint',
  wallet: '0x3D85c41E1a24a970a93436BF6379F53317272d6C',
  usd: 5000, // depositUSDValue 5000e18
  week: '2025-03-31', // Thursday 2025-04-03
});
assert.deepEqual(decodeFlowLog(usdyRedemption, 'USDY'), {
  token: 'USDY',
  kind: 'redeem',
  wallet: '0xdB63429AFD672B774A1C99b9e8E78229c676c878',
  usd: 1.11641667, // redemptionUSDValue 1116416670000000000
  week: '2025-12-15', // a Monday is its own week
});
assert.deepEqual(decodeFlowLog(legacyMint, 'OUSG'), {
  token: 'OUSG',
  kind: 'mint',
  wallet: '0x7Fbe0de6ffA86f4B9528AA27029595429B0c74A9',
  usd: 10000, // usdcAmountIn 10000e6
  week: '2024-04-22',
});
assert.deepEqual(decodeFlowLog(legacyRebasingRedeem, 'OUSG'), {
  token: 'OUSG',
  kind: 'redeem',
  wallet: '0x7Fbe0de6ffA86f4B9528AA27029595429B0c74A9',
  usd: 49999.999999, // usdcAmountOut, the third data word
  week: '2024-04-22',
});

// Skipped events and bad input throw: InstantSubscriptionRebasingOUSG is not in the ABI.
assert.throws(() =>
  decodeFlowLog({ ...legacyMint, topics: ['0x' + '11'.repeat(32), legacyMint.topics[1]] }, 'OUSG')
);
assert.throws(() => decodeFlowLog({ ...legacyMint, block_timestamp: 'nope' }, 'OUSG'), /block_timestamp/);

// Aggregation: one wallet minting and redeeming in the same week counts once in uniqueWallets.
const A = '0x000000000000000000000000000000000000000A';
const B = '0x000000000000000000000000000000000000000b';
const ev = (e: Partial<FlowEvent>): FlowEvent => ({ token: 'OUSG', kind: 'mint', wallet: A, usd: 100, week: '2026-09-14', ...e });
const meta = { asOf: '2026-09-24T00:00:00.000Z', source: 'test' };
const rows = aggregateWeekly(
  [
    ev({}),
    ev({ usd: 50 }),
    ev({ kind: 'redeem', usd: 30 }),
    ev({ kind: 'redeem', wallet: B, usd: 20 }),
    ev({ token: 'USDY', usd: 7 }),
    ev({ week: '2026-09-07', kind: 'redeem', usd: 5 }),
  ],
  meta
);
assert.deepEqual(
  rows.map((r) => [r.week, r.token]),
  [
    ['2026-09-07', 'OUSG'],
    ['2026-09-14', 'OUSG'],
    ['2026-09-14', 'USDY'],
  ]
);
const w = rows[1];
assert.equal(w.mintVolumeUsd, 150);
assert.equal(w.redeemVolumeUsd, 50);
assert.equal(w.netFlowUsd, 100);
assert.equal(w.mintCount, 2);
assert.equal(w.redeemCount, 2);
assert.equal(w.uniqueMinters, 1);
assert.equal(w.uniqueRedeemers, 2);
assert.equal(w.uniqueWallets, 2); // A on both sides + B, not 1 + 2
assert.equal(w.dataSource, 'live');
assert.equal(w.asOf, meta.asOf);
assert.equal(rows[0].mintCount, 0);
assert.equal(rows[0].netFlowUsd, -5);
assert.equal(rows[2].uniqueWallets, 1);

console.log(`flowEvents check ok (${rows.length} rows)`);
