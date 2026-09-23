/**
 * Weekly instant mint/redeem flows (Pillar 2) for OUSG and USDY.
 *
 * Live path: latest results of queries/mint_redeem_volume.sql on Dune
 * (env DUNE_API_KEY + DUNE_MINT_REDEEM_QUERY_ID). Any missing config or error
 * falls back to the labeled mock series and logs why.
 */

import { getLatestResults, isDuneConfigured } from './dune';
import { mondayOf } from './flowStats';
import { MOCK_DATA } from './mockData';
import type { DataSource, WeeklyFlow } from './types';

export interface WeeklyFlowsResult {
  rows: WeeklyFlow[];
  dataSource: DataSource;
  /** Dune query page when live, else null */
  queryUrl: string | null;
}

/** Map one snake_case Dune row to a WeeklyFlow. Throws on a malformed row. */
export function mapDuneRow(
  row: Record<string, unknown>,
  meta: { asOf: string; source: string }
): WeeklyFlow {
  const week = String(row.week ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || mondayOf(week) !== week) {
    throw new Error(`bad week value: ${String(row.week)}`);
  }
  const token = row.token;
  if (token !== 'OUSG' && token !== 'USDY') {
    throw new Error(`bad token value: ${String(token)}`);
  }
  const num = (key: string): number => {
    const n = Number(row[key] ?? 0);
    if (!Number.isFinite(n)) throw new Error(`bad ${key} value: ${String(row[key])}`);
    return n;
  };
  return {
    week,
    token,
    mintVolumeUsd: num('mint_volume_usd'),
    redeemVolumeUsd: num('redeem_volume_usd'),
    netFlowUsd: num('net_flow_usd'),
    mintCount: num('mint_count'),
    redeemCount: num('redeem_count'),
    uniqueMinters: num('unique_minters'),
    uniqueRedeemers: num('unique_redeemers'),
    uniqueWallets: num('unique_wallets'),
    dataSource: 'live',
    asOf: meta.asOf,
    source: meta.source,
  };
}

function mockResult(reason: string): WeeklyFlowsResult {
  console.warn(`[weeklyFlows] using mock data: ${reason}`);
  return { rows: MOCK_DATA.weeklyFlows, dataSource: 'mocked', queryUrl: null };
}

export async function getWeeklyFlows(): Promise<WeeklyFlowsResult> {
  if (!isDuneConfigured()) return mockResult('DUNE_API_KEY not set');

  const rawId = process.env.DUNE_MINT_REDEEM_QUERY_ID;
  const queryId = Number(rawId);
  if (!Number.isInteger(queryId) || queryId <= 0) {
    return mockResult(`DUNE_MINT_REDEEM_QUERY_ID is not a positive integer (${rawId ?? 'unset'})`);
  }

  const queryUrl = `https://dune.com/queries/${queryId}`;
  try {
    const result = await getLatestResults(queryId);
    const raw = result.result?.rows;
    if (!raw?.length) return mockResult(`Dune query ${queryId} returned no rows (${result.state})`);
    // asOf is when Dune last ran the query, not now: weeks after it are unknown, not zero.
    const meta = { asOf: result.execution_ended_at ?? new Date().toISOString(), source: queryUrl };
    const rows = raw
      .map((r) => mapDuneRow(r, meta))
      .sort((a, b) => a.week.localeCompare(b.week) || a.token.localeCompare(b.token));
    return { rows, dataSource: 'live', queryUrl };
  } catch (err) {
    return mockResult(`Dune query ${queryId} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
