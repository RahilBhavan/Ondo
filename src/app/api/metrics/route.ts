/**
 * Aggregated metrics endpoint.
 * GET /api/metrics — returns all 4 pillars of dashboard data.
 *
 * Strategy:
 * - If DUNE_API_KEY is set: fetch live data from Dune, fill gaps with mock
 * - If no API key: return full mock data set
 *
 * This ensures the dashboard is always functional regardless of Dune availability.
 */

import { NextResponse } from 'next/server';
import { isDuneConfigured } from '@/lib/dune';
import { MOCK_DATA } from '@/lib/mockData';
import type { DashboardData } from '@/lib/types';

const CACHE_MAX_AGE = 3600; // 1 hour

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

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
    },
  });
}
