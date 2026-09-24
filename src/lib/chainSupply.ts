/**
 * TVL per (token, chain) for OUSG and USDY (Pillar 3): on-chain total supply
 * × the Ethereum OndoOracle price (every chain shares it).
 *
 * Bridges are LayerZero OFT burn/mint, so each chain's supply is its own float:
 * no lockbox subtraction. rUSDY, mUSD and rOUSG wrap tokens already counted here
 * and are left out. All reads run in parallel with an 8s timeout and a 1hr
 * in-memory cache. A failed read falls back to that row's mock value; a failed
 * price read falls back on every row.
 */

import { createPublicClient, formatUnits, http, parseAbi } from 'viem';
import { MOCK_DATA } from './mockData';
import { getTokenPrices, type TokenPrices } from './prices';
import type { Chain, ChainTVL, LiquidityCell } from './types';

type Token = 'OUSG' | 'USDY';

type Reader =
  | { kind: 'evm'; rpc: string; address: `0x${string}` }
  | { kind: 'solana'; mint: string }
  | { kind: 'sui'; coinType: string }
  | { kind: 'aptos'; coinType: string }
  | { kind: 'noble'; denom: string }
  | { kind: 'stellar'; code: string; issuer: string }
  | { kind: 'xrpl'; issuer: string; currency: string };

interface SupplySource {
  token: Token;
  chain: Chain;
  reader: Reader;
  /** Explorer or API page for this asset */
  source: string;
}

const TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 60 * 60 * 1000;

const ETH_RPC = 'https://ethereum-rpc.publicnode.com';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const SUI_GRAPHQL = 'https://graphql.mainnet.sui.io/graphql';
const APTOS_VIEW = 'https://api.mainnet.aptoslabs.com/v1/view';
const NOBLE_REST = 'https://rest.cosmos.directory/noble/cosmos/bank/v1beta1/supply/by_denom';
const HORIZON = 'https://horizon.stellar.org/assets';
const XRPL_RPC = 'https://xrplcluster.com';

const SUI_USDY = '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY';
const APTOS_USDY = '0xcfea864b32833f157f042618bd845145256b1bf4c0da34a7013b76e42daa53cc::usdy::USDY';
const STELLAR_USDY_ISSUER = 'GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6';
const XRPL_OUSG_ISSUER = 'rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p';

const evm = (rpc: string, address: `0x${string}`): Reader => ({ kind: 'evm', rpc, address });

export const SUPPLY_SOURCES: SupplySource[] = [
  { token: 'USDY', chain: 'ethereum', reader: evm(ETH_RPC, '0x96F6eF951840721AdBF46Ac996b59E0235CB985C'), source: 'https://etherscan.io/token/0x96F6eF951840721AdBF46Ac996b59E0235CB985C' },
  { token: 'OUSG', chain: 'ethereum', reader: evm(ETH_RPC, '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92'), source: 'https://etherscan.io/token/0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92' },
  { token: 'USDY', chain: 'mantle', reader: evm('https://mantle-rpc.publicnode.com', '0x5bE26527e817998A7206475496fDE1E68957c5A6'), source: 'https://mantlescan.xyz/token/0x5bE26527e817998A7206475496fDE1E68957c5A6' },
  { token: 'USDY', chain: 'arbitrum', reader: evm('https://arbitrum-one-rpc.publicnode.com', '0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D'), source: 'https://arbiscan.io/token/0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D' },
  { token: 'OUSG', chain: 'polygon', reader: evm('https://polygon-bor-rpc.publicnode.com', '0xbA11C5effA33c4D6F8f593CFA394241CfE925811'), source: 'https://polygonscan.com/token/0xbA11C5effA33c4D6F8f593CFA394241CfE925811' },
  { token: 'USDY', chain: 'solana', reader: { kind: 'solana', mint: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6' }, source: 'https://solscan.io/token/A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6' },
  { token: 'OUSG', chain: 'solana', reader: { kind: 'solana', mint: 'i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc' }, source: 'https://solscan.io/token/i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc' },
  { token: 'USDY', chain: 'sui', reader: { kind: 'sui', coinType: SUI_USDY }, source: `https://suiscan.xyz/mainnet/coin/${SUI_USDY}` },
  { token: 'USDY', chain: 'aptos', reader: { kind: 'aptos', coinType: APTOS_USDY }, source: `https://explorer.aptoslabs.com/coin/${APTOS_USDY}?network=mainnet` },
  { token: 'USDY', chain: 'noble', reader: { kind: 'noble', denom: 'ausdy' }, source: `${NOBLE_REST}?denom=ausdy` },
  { token: 'USDY', chain: 'stellar', reader: { kind: 'stellar', code: 'USDY', issuer: STELLAR_USDY_ISSUER }, source: `https://stellar.expert/explorer/public/asset/USDY-${STELLAR_USDY_ISSUER}` },
  { token: 'USDY', chain: 'plume', reader: evm('https://rpc.plume.org', '0xD2B65e851Be3d80D3c2ce795eB2E78f16cB088b2'), source: 'https://explorer.plume.org/token/0xD2B65e851Be3d80D3c2ce795eB2E78f16cB088b2' },
  { token: 'USDY', chain: 'sei', reader: evm('https://evm-rpc.sei-apis.com', '0x54cD901491AeF397084453F4372B93c33260e2A6'), source: 'https://seitrace.com/token/0x54cD901491AeF397084453F4372B93c33260e2A6' },
  { token: 'USDY', chain: 'bnb', reader: evm('https://bsc-rpc.publicnode.com', '0x608593d17A2decBbc4399e4185bE4922F97eD32E'), source: 'https://bscscan.com/token/0x608593d17A2decBbc4399e4185bE4922F97eD32E' },
  { token: 'OUSG', chain: 'xrp-ledger', reader: { kind: 'xrpl', issuer: XRPL_OUSG_ISSUER, currency: '4F55534700000000000000000000000000000000' }, source: `https://xrpscan.com/account/${XRPL_OUSG_ISSUER}` },
];

// --- Unit conversion (pure, covered by chainSupply.check.ts) ---

/** Integer base units (string or bigint) to token units. */
export function fromBaseUnits(raw: string | bigint, decimals: number): number {
  return Number(formatUnits(BigInt(raw), decimals));
}

/** Horizon asset record to circulating supply: every place the asset can sit, as decimal strings. */
export function stellarSupply(rec: Record<string, unknown>): number {
  const balances = (rec.balances ?? {}) as Record<string, string | undefined>;
  const parts = [
    balances.authorized,
    balances.authorized_to_maintain_liabilities,
    rec.contracts_amount,
    rec.liquidity_pools_amount,
    rec.claimable_balances_amount,
  ];
  return parts.reduce<number>((sum, v) => sum + (v === undefined ? 0 : num(v)), 0);
}

/** gateway_balances result to outstanding issued amount (already token units). */
export function xrplSupply(result: Record<string, unknown>, currency: string): number {
  if (result.status !== 'success') throw new Error(`xrpl status ${String(result.status)}`);
  const obligations = (result.obligations ?? {}) as Record<string, string>;
  // No obligations entry means nothing outstanding.
  return obligations[currency] === undefined ? 0 : num(obligations[currency]);
}

function num(v: unknown): number {
  if (typeof v !== 'string' && typeof v !== 'number') throw new Error(`bad amount: ${String(v)}`);
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`bad amount: ${String(v)}`);
  return n;
}

// --- Readers ---

const erc20 = parseAbi(['function totalSupply() view returns (uint256)']);

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

async function readSupply(r: Reader): Promise<number> {
  switch (r.kind) {
    case 'evm': {
      const client = createPublicClient({ transport: http(r.rpc, { timeout: TIMEOUT_MS, retryCount: 0 }) });
      // Every Ondo EVM deployment uses 18 decimals.
      return fromBaseUnits(await client.readContract({ address: r.address, abi: erc20, functionName: 'totalSupply' }), 18);
    }
    case 'solana': {
      const j = await postJson(SOLANA_RPC, { jsonrpc: '2.0', id: 1, method: 'getTokenSupply', params: [r.mint] });
      const v = (j.result as { value?: { amount: string; decimals: number } } | undefined)?.value;
      if (!v) throw new Error(`solana: ${JSON.stringify(j.error ?? j)}`);
      return fromBaseUnits(v.amount, v.decimals);
    }
    case 'sui': {
      const j = await postJson(SUI_GRAPHQL, {
        query: `{coinMetadata(coinType:"${r.coinType}"){supply decimals}}`,
      });
      const m = (j.data as { coinMetadata?: { supply: string; decimals: number } } | undefined)?.coinMetadata;
      if (!m?.supply) throw new Error(`sui: ${JSON.stringify(j.errors ?? j)}`);
      return fromBaseUnits(m.supply, m.decimals);
    }
    case 'aptos': {
      const res = await fetch(APTOS_VIEW, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ function: '0x1::coin::supply', type_arguments: [r.coinType], arguments: [] }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`aptos HTTP ${res.status}`);
      const raw = ((await res.json()) as [{ vec: string[] }])[0]?.vec?.[0];
      if (raw === undefined) throw new Error('aptos: supply not tracked');
      return fromBaseUnits(raw, 6);
    }
    case 'noble': {
      const j = await getJson(`${NOBLE_REST}?denom=${r.denom}`);
      const amount = (j.amount as { amount?: string } | undefined)?.amount;
      if (amount === undefined) throw new Error(`noble: ${JSON.stringify(j)}`);
      return fromBaseUnits(amount, 18);
    }
    case 'stellar': {
      const j = await getJson(`${HORIZON}?asset_code=${r.code}&asset_issuer=${r.issuer}`);
      const rec = (j._embedded as { records?: Record<string, unknown>[] } | undefined)?.records?.[0];
      if (!rec) throw new Error('stellar: asset not found');
      return stellarSupply(rec);
    }
    case 'xrpl': {
      const j = await postJson(XRPL_RPC, {
        method: 'gateway_balances',
        params: [{ account: r.issuer, ledger_index: 'validated' }],
      });
      return xrplSupply((j.result ?? {}) as Record<string, unknown>, r.currency);
    }
  }
}

// --- Assembly ---

const key = (token: Token, chain: Chain) => `${token}:${chain}`;

/** Recompute pctOfTotal (0-100) across the rows. */
function withPct(rows: ChainTVL[]): ChainTVL[] {
  const total = rows.reduce((s, r) => s + r.tvlUsd, 0);
  return rows.map((r) => ({ ...r, pctOfTotal: total > 0 ? (r.tvlUsd / total) * 100 : 0 }));
}

/**
 * Build rows from settled supply reads. A rejected read (or null prices) uses
 * the matching mock row, labeled 'mocked'. Pure: covered by chainSupply.check.ts.
 */
export function buildRows(
  sources: SupplySource[],
  supplies: PromiseSettledResult<number>[],
  prices: TokenPrices | null,
  mock: ChainTVL[],
  asOf: string
): ChainTVL[] {
  const mockByKey = new Map(mock.map((m) => [key(m.token, m.chain), m]));
  return withPct(
    sources.map((s, i) => {
      const got = supplies[i];
      if (prices && got?.status === 'fulfilled') {
        return {
          chain: s.chain,
          token: s.token,
          supply: got.value,
          tvlUsd: got.value * prices[s.token],
          pctOfTotal: 0,
          dataSource: 'live',
          asOf,
          source: s.source,
        };
      }
      const m = mockByKey.get(key(s.token, s.chain));
      if (!m) throw new Error(`no mock row for ${key(s.token, s.chain)}`);
      if (prices) console.warn(`[chainSupply] ${key(s.token, s.chain)} read failed, using mock:`, got?.status === 'rejected' ? String(got.reason) : 'missing');
      return { ...m, dataSource: 'mocked' };
    })
  );
}

/** Heatmap cells from the same rows (issuer = token). */
export function toLiquidityCells(rows: ChainTVL[]): LiquidityCell[] {
  return rows.map((r) => ({
    issuer: r.token,
    chain: r.chain,
    tvlUsd: r.tvlUsd,
    dataSource: r.dataSource,
    asOf: r.asOf,
    source: r.source,
  }));
}

let cached: { data: ChainTVL[]; timestamp: number } | null = null;

export async function getChainTVL(): Promise<ChainTVL[]> {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  const [priceResult, ...supplies] = await Promise.allSettled([
    getTokenPrices(),
    ...SUPPLY_SOURCES.map((s) => readSupply(s.reader)),
  ]);
  const prices = priceResult.status === 'fulfilled' ? (priceResult.value as TokenPrices) : null;
  if (!prices) console.warn('[chainSupply] price read failed, using mock for every row:', String((priceResult as PromiseRejectedResult).reason));
  const data = buildRows(SUPPLY_SOURCES, supplies as PromiseSettledResult<number>[], prices, MOCK_DATA.chainBreakdown, new Date().toISOString());
  // Only cache a fully live read so a transient failure retries on the next request.
  if (data.every((r) => r.dataSource === 'live')) cached = { data, timestamp: Date.now() };
  return data;
}
