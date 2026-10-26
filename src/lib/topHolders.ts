/**
 * Top holders (Pillar 1) of OUSG and USDY on Ethereum, and of USDY on Stellar.
 *
 * Ethereum: Blockscout's token holders API (no key), top 15 per token. Stellar: stellar.expert's
 * asset holders API (no key), top 15 for USDY, the second-largest USDY chain by supply that has a
 * keyless holders list. Both are valued at the Ethereum Ondo oracle price (getTokenPrices).
 * A group whose fetch fails, or every group when the price read fails, falls back to its last
 * good rows (src/data/last-good.json, labeled cached with their original date). A group with no
 * last good rows is left out, never invented.
 */

import { getAddress } from 'viem';
import { holderName } from './addressRegistry';
import { asCached, LAST_GOOD } from './lastGood';
import { OUSG_ETHEREUM, USDY_ETHEREUM, getTokenPrices } from './prices';
import { combinedSource } from './dataSource';
import type { DataSource, HolderChain, HolderMetric } from './types';

export const TOP_N = 15;
const TOKENS = { OUSG: OUSG_ETHEREUM, USDY: USDY_ETHEREUM } as const;
type Token = keyof typeof TOKENS;

export interface TopHoldersResult {
  rows: HolderMetric[];
  dataSource: DataSource;
}

export const holdersPageUrl = (token: Token) =>
  `https://eth.blockscout.com/token/${TOKENS[token]}?tab=holders`;

/**
 * Blockscout's public name tag. Only tagType "name" counts ("generic" tags like
 * "Smart Account by Safe" say nothing about the owner); highest ordinal wins.
 * Ordinal-0 tags, tags equal to the contract name (`address.name`, e.g. CErc20DelegatorKYC)
 * and GnosisSafeProxy* tags are contract class names, not owners.
 */
export function publicTag(address: Record<string, unknown>): string | null {
  const tags = (address.metadata as { tags?: unknown } | null | undefined)?.tags;
  if (!Array.isArray(tags)) return null;
  const names = tags
    .filter(
      (t): t is { name: string; tagType: string; ordinal?: number } =>
        typeof t?.name === 'string' &&
        t.tagType === 'name' &&
        (t.ordinal ?? 0) > 0 &&
        t.name !== address.name &&
        !/^GnosisSafeProxy/i.test(t.name)
    )
    .sort((a, b) => (b.ordinal ?? 0) - (a.ordinal ?? 0));
  return names[0]?.name ?? null;
}

/** Map one Blockscout holder item to a HolderMetric. Throws on a malformed item. */
export function mapHolderItem(
  item: unknown,
  token: Token,
  price: number,
  asOf: string
): HolderMetric {
  const { address: addr, value } = (item ?? {}) as { address?: Record<string, unknown>; value?: unknown };
  if (!addr || typeof addr.hash !== 'string') throw new Error('holder item has no address.hash');
  const address = getAddress(addr.hash);
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error(`bad value for ${address}: ${String(value)}`);
  }
  // 18 decimals: split the integer string so large balances keep their precision.
  const padded = value.padStart(19, '0');
  const balance = Number(`${padded.slice(0, -18)}.${padded.slice(-18)}`);
  if (!(balance > 0) || !Number.isFinite(price) || price <= 0) {
    throw new Error(`non-positive balance or price for ${address}`);
  }
  return {
    chain: 'ethereum',
    name: holderName(address, publicTag(addr)),
    address,
    token,
    balance,
    tvlUsd: balance * price,
    dataSource: 'live',
    asOf,
    source: holdersPageUrl(token),
  };
}

async function fetchHolders(token: Token): Promise<unknown[]> {
  const res = await fetch(`https://eth.blockscout.com/api/v2/tokens/${TOKENS[token]}/holders`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Blockscout ${token} holders: HTTP ${res.status}`);
  const body = (await res.json()) as { items?: unknown };
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new Error(`Blockscout ${token} holders: no items`);
  }
  return body.items.slice(0, TOP_N);
}

export const STELLAR_USDY_ISSUER = 'GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6';
const STELLAR_HOLDERS_URL = `https://api.stellar.expert/explorer/public/asset/USDY-${STELLAR_USDY_ISSUER}/holders`;
export const stellarHoldersPageUrl = `https://stellar.expert/explorer/public/asset/USDY-${STELLAR_USDY_ISSUER}`;

/**
 * Map one stellar.expert holder record ({address, balance in 1e7 stroops as a string}) to a
 * HolderMetric. Throws on a malformed record.
 */
export function mapStellarHolder(item: unknown, price: number, asOf: string): HolderMetric {
  const { address, balance: raw } = (item ?? {}) as { address?: unknown; balance?: unknown };
  if (typeof address !== 'string' || !/^[GC][A-Z2-7]{55}$/.test(address)) {
    throw new Error(`bad stellar address: ${String(address)}`);
  }
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) throw new Error(`bad balance for ${address}: ${String(raw)}`);
  const balance = Number(raw) / 1e7;
  if (!(balance > 0) || !Number.isFinite(price) || price <= 0) {
    throw new Error(`non-positive balance or price for ${address}`);
  }
  return {
    chain: 'stellar',
    name: holderName(address, null),
    address,
    token: 'USDY',
    balance,
    tvlUsd: balance * price,
    dataSource: 'live',
    asOf,
    source: stellarHoldersPageUrl,
  };
}

async function fetchStellarHolders(): Promise<unknown[]> {
  const res = await fetch(`${STELLAR_HOLDERS_URL}?limit=${TOP_N}&order=desc`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`stellar.expert USDY holders: HTTP ${res.status}`);
  const body = (await res.json()) as { _embedded?: { records?: unknown } };
  const records = body._embedded?.records;
  if (!Array.isArray(records) || records.length === 0) throw new Error('stellar.expert USDY holders: no records');
  return records.slice(0, TOP_N);
}

type Group = { chain: HolderChain; token: Token };
const GROUPS: Group[] = [
  { chain: 'ethereum', token: 'OUSG' },
  { chain: 'ethereum', token: 'USDY' },
  { chain: 'stellar', token: 'USDY' },
];

/** Live rows for one (chain, token) group. Throws on any fetch or shape error. */
async function liveGroup(g: Group, price: number, asOf: string): Promise<HolderMetric[]> {
  if (g.chain === 'stellar') return (await fetchStellarHolders()).map((i) => mapStellarHolder(i, price, asOf));
  return (await fetchHolders(g.token)).map((i) => mapHolderItem(i, g.token, price, asOf));
}

/**
 * Join per-group reads: a fulfilled group is live, a rejected one uses that group's last good rows.
 * Pure: covered by topHolders.check.ts.
 */
export function assembleHolders(
  groups: Group[],
  reads: PromiseSettledResult<HolderMetric[]>[],
  lastGood: HolderMetric[]
): HolderMetric[] {
  return groups.flatMap((g, i) => {
    const got = reads[i];
    if (got?.status === 'fulfilled') return got.value;
    console.warn(`[topHolders] ${g.chain} ${g.token} read failed, using last good rows:`, got?.status === 'rejected' ? String(got.reason) : 'missing');
    return asCached(lastGood.filter((r) => r.chain === g.chain && r.token === g.token));
  });
}

export async function getTopHolders(): Promise<TopHoldersResult> {
  const asOf = new Date().toISOString();
  let reads: PromiseSettledResult<HolderMetric[]>[];
  try {
    const prices = await getTokenPrices();
    reads = await Promise.allSettled(GROUPS.map((g) => liveGroup(g, prices[g.token], asOf)));
  } catch (err) {
    reads = GROUPS.map(() => ({ status: 'rejected', reason: err }));
  }
  const rows = assembleHolders(GROUPS, reads, LAST_GOOD.topHolders);
  return { rows, dataSource: combinedSource(rows) };
}
