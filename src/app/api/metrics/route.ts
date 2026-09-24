/**
 * Aggregated metrics endpoint.
 * GET /api/metrics — returns all 4 pillars of dashboard data.
 *
 * Strategy:
 * - weeklyFlows: live from Dune via getWeeklyFlows() when DUNE_API_KEY and
 *   DUNE_MINT_REDEEM_QUERY_ID are set, else labeled mock (see src/lib/weeklyFlows.ts)
 * - topHolders: live from Dune via getTopHolders() (DUNE_TOP_HOLDERS_QUERY_ID) valued at
 *   the Ondo oracle price, else labeled mock (see src/lib/topHolders.ts)
 * - Every other field: mock data until its pillar is wired to Dune
 *
 * This ensures the dashboard is always functional regardless of Dune availability.
 */

import { NextResponse } from 'next/server';
import { isDuneConfigured } from '@/lib/dune';
import { MOCK_DATA } from '@/lib/mockData';
import { getTopHolders } from '@/lib/topHolders';
import { getWeeklyFlows } from '@/lib/weeklyFlows';
import type { DashboardData } from '@/lib/types';

const CACHE_MAX_AGE = 3600; // 1 hour
export const revalidate = 3600;

export async function GET() {
  let data: DashboardData;

  if (isDuneConfigured()) {
    // Future: fetch live data from Dune queries and merge with mock fallbacks.
    // For now, return mock data with a flag indicating Dune is configured.
    // This will be wired up once query IDs are created on Dune.
    data = {
      ...MOCK_DATA,
      metrics: {
        ...MOCK_DATA.metrics,
        lastUpdated: new Date().toISOString(),
      },
    };
  } else {
    data = MOCK_DATA;
  }

  const [weeklyFlows, topHolders] = await Promise.all([getWeeklyFlows(), getTopHolders()]);
  data = { ...data, weeklyFlows: weeklyFlows.rows, topHolders: topHolders.rows };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
    },
  });
}
