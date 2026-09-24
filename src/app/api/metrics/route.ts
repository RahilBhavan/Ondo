/**
 * Aggregated metrics endpoint.
 * GET /api/metrics — the same data the home page renders, from the same getters:
 *
 * - weeklyFlows: Dune (src/lib/weeklyFlows.ts)
 * - chainBreakdown + totalTvlUsd: on-chain supply × OndoOracle price (src/lib/chainSupply.ts)
 * - topHolders: Blockscout, Ethereum only (src/lib/topHolders.ts)
 * - competitorBenchmark: DefiLlama, Ondo row on-chain when every chain row is live (src/lib/benchmark.ts)
 *
 * Every row carries its own dataSource / asOf / source; a failed source falls back to its
 * labeled mock rows.
 */

import { NextResponse } from 'next/server';
import { getBenchmark, withOnchainOndo } from '@/lib/benchmark';
import { getChainTVL } from '@/lib/chainSupply';
import { combinedSource } from '@/lib/dataSource';
import { getTopHolders } from '@/lib/topHolders';
import { getWeeklyFlows } from '@/lib/weeklyFlows';

const CACHE_MAX_AGE = 3600; // 1 hour
export const revalidate = 3600;

export async function GET() {
  const [weeklyFlows, chainBreakdown, topHolders, benchmark] = await Promise.all([
    getWeeklyFlows(),
    getChainTVL(),
    getTopHolders(),
    getBenchmark(),
  ]);

  const data = {
    totalTvlUsd: chainBreakdown.reduce((sum, r) => sum + r.tvlUsd, 0),
    totalTvlDataSource: combinedSource(chainBreakdown),
    chainBreakdown,
    topHolders: topHolders.rows,
    weeklyFlows: weeklyFlows.rows,
    competitorBenchmark: withOnchainOndo(benchmark.rows, chainBreakdown),
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
    },
  });
}
