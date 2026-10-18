/**
 * Weekly gross mints and redemptions for six assets on Ethereum, from raw event logs.
 * Writes src/data/issuance.json. Run: node scripts/backfill-issuance.mjs
 *
 * Source: Tenderly's public mainnet gateway (eth_getLogs over wide block ranges, no key). A range that
 * errors or returns 10000 logs is halved until it fits. (Blockscout's keyless RPC allows ~10 calls,
 * then blocks the IP for about 40 minutes; its REST logs endpoint times out on USDC.)
 * Logs carry no timestamp, so block -> time is linearly interpolated between
 * anchor blocks fetched every ANCHOR_STEP blocks (error: well under an hour, weeks are 168h).
 * Week = Monday 00:00 UTC, as in src/lib/flowEvents.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { decodeAbiParameters, getAddress, parseAbi, toEventSelector } from 'viem';

const RPC = 'https://gateway.tenderly.co/public/mainnet';
const CLOCK_RPC = RPC;
const START_BLOCK = 16_308_190; // 2023-01-01 00:00 UTC, before the March 2023 USDC depeg
const ANCHOR_STEP = 25_000;
// Circle CCTP token minters (v1, v2). A cross-chain USDC transfer burns on one chain and mints on
// another through these, so it is not new issuance; reported separately as bridgeMintUsd / bridgeRedeemUsd.
const CCTP_MINTERS = new Set(['0xc4922d64a24675e16e1586e3e3aa56c06fabe907', '0xfd78ee919681417d192449715b2594ab58f5d002']);
// Paxos minted 300 trillion PYUSD by mistake on 2025-10-15 and burned it minutes later (blocks 23585095 and
// 23585206). Net zero, nothing circulated; excluded so it does not swamp every other week.
const EXCLUDED_TX = new Set([
  '0xc45dd1a77c05d9ae5b2284eea5393ecce2ac8a7e88e973c6ba3fe7a18bf45634',
  '0xaa532ae7f06cccdbdc226f59b68733ae8594464a98e128365f8170e305c34f4b',
]);
const ONLY = new Set(process.argv.slice(2)); // optional: re-run only these assets, merge into the existing file
const ZERO_TOPIC = '0x' + '0'.repeat(64);
const TRANSFER = toEventSelector('event Transfer(address indexed from, address indexed to, uint256 value)');
const sel = (s) => toEventSelector(s);

/** side: mint | redeem. topics: indexed filter. amount: 'data0' = first data word. */
const ASSETS = [
  {
    asset: 'USDC', issuer: 'Circle', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    series: [
      { side: 'mint', topics: [sel('event Mint(address indexed minter, address indexed to, uint256 amount)')], wallet: 2, word: 0 },
      { side: 'redeem', topics: [sel('event Burn(address indexed burner, uint256 amount)')], wallet: 1, word: 0 },
    ],
  },
  {
    asset: 'USDT', issuer: 'Tether', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    series: [
      { side: 'mint', topics: [sel('event Issue(uint256 amount)')], word: 0 },
      { side: 'redeem', topics: [sel('event Redeem(uint256 amount)')], word: 0 },
    ],
  },
  {
    asset: 'PYUSD', issuer: 'PayPal (Paxos)', decimals: 6, address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
    series: [
      { side: 'mint', topics: [TRANSFER, ZERO_TOPIC], wallet: 2, word: 0 },
      { side: 'redeem', topics: [TRANSFER, null, ZERO_TOPIC], wallet: 1, word: 0 },
    ],
  },
  {
    asset: 'BUIDL', issuer: 'BlackRock (Securitize)', decimals: 6, address: '0x7712c34205737192402172409a8F7ccef8aA2AEc',
    series: [
      { side: 'mint', topics: [sel('event Issue(address indexed recipient, uint256 amount, uint256 maturityTimestamp)')], wallet: 1, word: 0 },
      { side: 'redeem', topics: [sel('event Burn(address indexed burner, uint256 value, string reason)')], wallet: 1, word: 0 },
    ],
  },
  {
    asset: 'OUSG', issuer: 'Ondo', decimals: 18, address: '0x93358db73B6cd4b98D89c8F5f230E81a95c2643a',
    series: [
      { side: 'mint', topics: [sel('event Subscription(address indexed subscriber, bytes32 indexed subscriberId, uint256 rwaAmount, address depositToken, uint256 depositAmount, uint256 depositUSDValue, uint256 fee)')], wallet: 1, word: 3 },
      { side: 'redeem', topics: [sel('event Redemption(address indexed redeemer, bytes32 indexed redeemerId, uint256 rwaAmount, address receivingToken, uint256 receiveTokenAmount, uint256 redemptionUSDValue, uint256 fee)')], wallet: 1, word: 3 },
    ],
  },
  {
    // legacy OUSG InstantManager (Apr 2024 to Apr 2025): USDC amount in/out, 1e6
    asset: 'OUSG', issuer: 'Ondo', decimals: 6, address: '0x2826989983e3a66F0622132D019c2Ae173eb6A43', legacy: true,
    series: [
      { side: 'mint', topics: [sel('event InstantMintOUSG(address indexed sender, uint256 usdcAmountIn, uint256 ousgAmountOut)')], wallet: 1, word: 0 },
      { side: 'mint', topics: [sel('event InstantMintRebasingOUSG(address indexed sender, uint256 usdcAmountIn, uint256 ousgAmountOut, uint256 rousgAmountOut)')], wallet: 1, word: 0 },
      { side: 'redeem', topics: [sel('event InstantRedemptionOUSG(address indexed sender, uint256 ousgAmountIn, uint256 usdcAmountOut)')], wallet: 1, word: 1 },
      { side: 'redeem', topics: [sel('event InstantRedemptionRebasingOUSG(address indexed sender, uint256 rousgAmountIn, uint256 ousgAmountIn, uint256 usdcAmountOut)')], wallet: 1, word: 2 },
    ],
  },
  {
    asset: 'USDY', issuer: 'Ondo', decimals: 18, address: '0xa42613C243b67BF6194Ac327795b926B4b491f15',
    series: [
      { side: 'mint', topics: [sel('event Subscription(address indexed subscriber, bytes32 indexed subscriberId, uint256 rwaAmount, address depositToken, uint256 depositAmount, uint256 depositUSDValue, uint256 fee)')], wallet: 1, word: 3 },
      { side: 'redeem', topics: [sel('event Redemption(address indexed redeemer, bytes32 indexed redeemerId, uint256 rwaAmount, address receivingToken, uint256 receiveTokenAmount, uint256 redemptionUSDValue, uint256 fee)')], wallet: 1, word: 3 },
    ],
  },
];

async function rpc(method, params, tries = 8, url = RPC) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 8000 * (i + 1))); if (i === tries - 1) throw new Error('429'); continue; }
      const j = await res.json();
      if (j.result !== undefined && !j.error) return j.result;
      throw new Error(JSON.stringify(j).slice(0, 200));
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}
const hex = (n) => '0x' + n.toString(16);

const CHUNK = 100_000;
const LOG_CAP = 20_000; // Tenderly errors above this many results
/** One range; on error (too many results) or a full page, halve it. A wide single call silently
 * returned 22 of ~100k USDC mints, so the range is always walked in CHUNK-sized windows. */
async function getRange(address, topics, from, to, out) {
  let r;
  try {
    r = await rpc('eth_getLogs', [{ address, topics, fromBlock: hex(from), toBlock: hex(to) }], 4);
  } catch (e) {
    if (to - from < 100) throw e;
    r = null;
  }
  if ((r === null || r.length >= LOG_CAP) && to > from) {
    const mid = Math.floor((from + to) / 2);
    await getRange(address, topics, from, mid, out);
    await getRange(address, topics, mid + 1, to, out);
  } else out.push(...r);
}

async function getLogs(address, topics, from, to, out) {
  const windows = [];
  for (let b = from; b <= to; b += CHUNK) windows.push([b, Math.min(b + CHUNK - 1, to)]);
  const parts = windows.map(() => []);
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < windows.length) {
      const i = next++;
      await getRange(address, topics, windows[i][0], windows[i][1], parts[i]);
    }
  }));
  for (const p of parts) out.push(...p);
}

async function buildClock(head) {
  const anchors = [];
  for (let b = START_BLOCK; b < head; b += ANCHOR_STEP) anchors.push(b);
  anchors.push(head);
  const times = [];
  for (let i = 0; i < anchors.length; i += 5) {
    const part = await Promise.all(anchors.slice(i, i + 5).map(async (b) => {
      const blk = await rpc('eth_getBlockByNumber', [hex(b), false], 8, CLOCK_RPC);
      return [b, parseInt(blk.timestamp, 16)];
    }));
    times.push(...part);
  }
  return (block) => {
    let i = Math.min(Math.floor((block - START_BLOCK) / ANCHOR_STEP), times.length - 2);
    i = Math.max(i, 0);
    const [b0, t0] = times[i], [b1, t1] = times[i + 1];
    return t0 + ((block - b0) / (b1 - b0)) * (t1 - t0);
  };
}

const mondayOf = (sec) => {
  const d = new Date(sec * 1000);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
};

const head = parseInt(await rpc('eth_blockNumber', [], 8, CLOCK_RPC), 16);
const clock = await buildClock(head);
const asOf = new Date().toISOString();
const weeks = new Map(); // `${week}|${asset}` -> row
const audit = {};
const counterparties = { mint: {}, redeem: {} };

for (const a of ASSETS.filter((x) => !ONLY.size || ONLY.has(x.asset))) {
  for (const s of a.series) {
    const logs = [];
    await getLogs(a.address, s.topics, START_BLOCK, head, logs);
    // post-filter: the RPC may match extra topic positions
    const mine = logs.filter((l) => l.topics[0].toLowerCase() === s.topics[0].toLowerCase());
    console.log(a.asset, a.legacy ? '(legacy)' : '', s.side, mine.length, 'logs');
    audit[`${a.asset}${a.legacy ? '-legacy' : ''}:${s.side}`] = (audit[`${a.asset}${a.legacy ? '-legacy' : ''}:${s.side}`] ?? 0) + mine.length;
    for (const l of mine) {
      if (EXCLUDED_TX.has(l.transactionHash)) continue;
      const data = l.data.slice(2);
      const word = BigInt('0x' + data.slice(s.word * 64, s.word * 64 + 64));
      const usd = Number(word) / 10 ** a.decimals;
      const week = mondayOf(clock(parseInt(l.blockNumber, 16)));
      const wallet = s.wallet ? '0x' + l.topics[s.wallet].slice(26) : null;
      const key = `${week}|${a.asset}`;
      let r = weeks.get(key);
      if (!r) weeks.set(key, (r = { week, asset: a.asset, issuer: a.issuer, mintUsd: 0, redeemUsd: 0, bridgeMintUsd: 0, bridgeRedeemUsd: 0, mintCount: 0, redeemCount: 0, _w: new Set() }));
      const bridged = a.asset === 'USDC' && CCTP_MINTERS.has('0x' + l.topics[1].slice(26));
      if (a.asset === 'USDC') counterparties[s.side][bridged ? 'cctp' : 'other'] = (counterparties[s.side][bridged ? 'cctp' : 'other'] ?? 0) + usd;
      if (s.side === 'mint') { r.mintUsd += usd; r.mintCount++; if (bridged) r.bridgeMintUsd += usd; } else { r.redeemUsd += usd; r.redeemCount++; if (bridged) r.bridgeRedeemUsd += usd; }
      if (wallet) r._w.add(wallet);
    }
  }
}

const OUT = new URL('../src/data/issuance.json', import.meta.url);
const prev = ONLY.size && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const fresh = [...weeks.values()]
  .map(({ _w, ...r }) => ({ ...r, mintUsd: Math.round(r.mintUsd), redeemUsd: Math.round(r.redeemUsd), bridgeMintUsd: Math.round(r.bridgeMintUsd), bridgeRedeemUsd: Math.round(r.bridgeRedeemUsd), wallets: _w.size }));
const rows = [...(prev ? prev.rows.filter((r) => !ONLY.has(r.asset)) : []), ...fresh]
  .sort((x, y) => x.week.localeCompare(y.week) || x.asset.localeCompare(y.asset));
writeFileSync(OUT, JSON.stringify({ asOf, startBlock: START_BLOCK, headBlock: head, audit: { ...(prev?.audit ?? {}), ...audit }, usdcCounterparties: ONLY.size && !ONLY.has('USDC') ? prev?.usdcCounterparties : counterparties, rows }, null, 1));
console.log('rows', rows.length, 'head', head);
