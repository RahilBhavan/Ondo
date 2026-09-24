/**
 * Top Ethereum holders (Pillar 1) of OUSG and USDY.
 *
 * Live path: Blockscout's token holders API (no key), top 15 per token, valued at the
 * Ondo oracle price (getTokenPrices). Any HTTP error, malformed body, or price error
 * falls back to the labeled mock snapshot and logs why.
 */

import { getAddress } from 'viem';
import { holderName } from './addressRegistry';
import { MOCK_DATA } from './mockData';
import { OUSG_ETHEREUM, USDY_ETHEREUM, getTokenPrices } from './prices';
import type { DataSource, HolderMetric } from './types';

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
 * GnosisSafeProxy* name tags are contract class names, not owners.
 */
export function publicTag(address: Record<string, unknown>): string | null {
  const tags = (address.metadata as { tags?: unknown } | null | undefined)?.tags;
  if (!Array.isArray(tags)) return null;
  const names = tags
    .filter(
      (t): t is { name: string; tagType: string; ordinal?: number } =>
        typeof t?.name === 'string' && t.tagType === 'name' && !/^GnosisSafeProxy/i.test(t.name)
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

function mockResult(reason: string): TopHoldersResult {
  console.warn(`[topHolders] using mock data: ${reason}`);
  return { rows: MOCK_DATA.topHolders, dataSource: 'mocked' };
}

export async function getTopHolders(): Promise<TopHoldersResult> {
  try {
    const [ousg, usdy, prices] = await Promise.all([
      fetchHolders('OUSG'),
      fetchHolders('USDY'),
      getTokenPrices(),
    ]);
    const asOf = new Date().toISOString();
    const rows = [
      ...ousg.map((i) => mapHolderItem(i, 'OUSG', prices.OUSG, asOf)),
      ...usdy.map((i) => mapHolderItem(i, 'USDY', prices.USDY, asOf)),
    ];
    return { rows, dataSource: 'live' };
  } catch (err) {
    return mockResult(err instanceof Error ? err.message : String(err));
  }
}
