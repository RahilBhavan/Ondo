/**
 * Top Ethereum holders (Pillar 1) of OUSG and USDY.
 *
 * Live path: latest results of queries/top_holders.sql on Dune
 * (env DUNE_API_KEY + DUNE_TOP_HOLDERS_QUERY_ID), valued at the Ondo oracle price
 * (getTokenPrices). Any missing config, Dune error, or price error falls back to the
 * labeled mock snapshot and logs why.
 */

import { getAddress } from 'viem';
import { resolveAddress } from './addressRegistry';
import { getLatestResults, isDuneConfigured } from './dune';
import { MOCK_DATA } from './mockData';
import { getTokenPrices, type TokenPrices } from './prices';
import type { DataSource, HolderMetric } from './types';

export interface TopHoldersResult {
  rows: HolderMetric[];
  dataSource: DataSource;
  /** Dune query page when live, else null */
  queryUrl: string | null;
}

/** Map one snake_case Dune row to a HolderMetric. Throws on a malformed row. */
export function mapDuneRow(
  row: Record<string, unknown>,
  meta: { asOf: string; source: string },
  prices: Pick<TokenPrices, 'OUSG' | 'USDY'>
): HolderMetric {
  const token = row.token;
  if (token !== 'OUSG' && token !== 'USDY') {
    throw new Error(`bad token value: ${String(token)}`);
  }
  // Dune returns lowercase hex; the registry is keyed by checksummed addresses.
  const address = getAddress(String(row.address ?? ''));
  const balance = Number(row.balance);
  if (!Number.isFinite(balance) || balance <= 0) {
    throw new Error(`bad balance value: ${String(row.balance)}`);
  }
  // Dune timestamps look like "2026-09-23 09:53:35.000 UTC".
  const ts = new Date(String(row.last_activity ?? '').replace(' UTC', 'Z').replace(' ', 'T'));
  if (Number.isNaN(ts.getTime())) {
    throw new Error(`bad last_activity value: ${String(row.last_activity)}`);
  }
  return {
    name: resolveAddress(address),
    address,
    token,
    balance,
    tvlUsd: balance * prices[token],
    lastActivity: ts.toISOString(),
    dataSource: 'live',
    asOf: meta.asOf,
    source: meta.source,
  };
}

function mockResult(reason: string): TopHoldersResult {
  console.warn(`[topHolders] using mock data: ${reason}`);
  return { rows: MOCK_DATA.topHolders, dataSource: 'mocked', queryUrl: null };
}

export async function getTopHolders(): Promise<TopHoldersResult> {
  if (!isDuneConfigured()) return mockResult('DUNE_API_KEY not set');

  const rawId = process.env.DUNE_TOP_HOLDERS_QUERY_ID;
  const queryId = Number(rawId);
  if (!Number.isInteger(queryId) || queryId <= 0) {
    return mockResult(`DUNE_TOP_HOLDERS_QUERY_ID is not a positive integer (${rawId ?? 'unset'})`);
  }

  const queryUrl = `https://dune.com/queries/${queryId}`;
  try {
    const [result, prices] = await Promise.all([getLatestResults(queryId), getTokenPrices()]);
    const raw = result.result?.rows;
    if (!raw?.length) return mockResult(`Dune query ${queryId} returned no rows (${result.state})`);
    // Balances are as of the Dune run; the price is as of the oracle read.
    const meta = {
      asOf: result.execution_ended_at ?? new Date().toISOString(),
      source: `${queryUrl} × ${prices.source}`,
    };
    const rows = raw
      .map((r) => mapDuneRow(r, meta, prices))
      .sort((a, b) => a.token.localeCompare(b.token) || b.balance - a.balance);
    return { rows, dataSource: 'live', queryUrl };
  } catch (err) {
    return mockResult(`top holders failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
