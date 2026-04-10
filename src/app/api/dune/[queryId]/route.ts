/**
 * Cached Dune API proxy.
 * GET /api/dune/[queryId] — fetches latest results for a Dune query.
 *
 * Cache: 1hr TTL via both in-memory cache (dune.ts) and HTTP cache headers.
 * Fallback: returns 503 with error message if Dune is unavailable.
 */

import { NextResponse } from 'next/server';
import { getLatestResults, isDuneConfigured } from '@/lib/dune';

const CACHE_MAX_AGE = 3600; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: { queryId: string } }
) {
  const queryId = parseInt(params.queryId, 10);

  if (isNaN(queryId) || queryId <= 0) {
    return NextResponse.json(
      { error: 'Invalid query ID' },
      { status: 400 }
    );
  }

  if (!isDuneConfigured()) {
    return NextResponse.json(
      { error: 'Dune API not configured. Set DUNE_API_KEY environment variable.' },
      { status: 503 }
    );
  }

  try {
    const result = await getLatestResults(queryId);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Dune query failed: ${message}` },
      { status: 502 }
    );
  }
}
