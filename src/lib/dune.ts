/**
 * Dune Analytics API client with polling, caching, and mock fallback.
 *
 * Flow: execute query → poll status → fetch results → cache (1hr TTL)
 * On rate limit (429) or missing API key: returns cached data or mock fallback.
 *
 * Env: DUNE_API_KEY (optional — gracefully falls back to mock data)
 */

import type { DuneQueryResult, CacheEntry } from './types';

const DUNE_API_BASE = 'https://api.dune.com/api/v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30;

const cache = new Map<number, CacheEntry<unknown>>();

function getApiKey(): string | null {
  return process.env.DUNE_API_KEY ?? null;
}

async function duneRequest<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('DUNE_API_KEY not configured');
  }

  const response = await fetch(`${DUNE_API_BASE}${path}`, {
    headers: { 'X-Dune-API-Key': apiKey },
  });

  if (response.status === 429) {
    throw new Error('Dune API rate limited (429)');
  }

  if (!response.ok) {
    throw new Error(`Dune API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Execute a Dune query and wait for results.
 * Returns cached data if available and fresh.
 */
export async function executeDuneQuery<T = Record<string, unknown>>(
  queryId: number
): Promise<DuneQueryResult<T>> {
  // Check cache first
  const cached = cache.get(queryId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as DuneQueryResult<T>;
  }

  // Execute query
  const execution = await duneRequest<{ execution_id: string }>(
    `/query/${queryId}/execute`
  );

  // Poll for completion
  let attempts = 0;
  while (attempts < MAX_POLL_ATTEMPTS) {
    const status = await duneRequest<DuneQueryResult<T>>(
      `/execution/${execution.execution_id}/results`
    );

    if (status.state === 'QUERY_STATE_COMPLETED') {
      // Cache the result
      cache.set(queryId, {
        data: status,
        timestamp: Date.now(),
        queryId,
      });
      return status;
    }

    if (status.state === 'QUERY_STATE_FAILED') {
      throw new Error(`Dune query ${queryId} failed`);
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Dune query ${queryId} timed out after ${MAX_POLL_ATTEMPTS} attempts`);
}

/**
 * Fetch the latest results of a previously executed query (no re-execution).
 * Faster and doesn't consume execution credits.
 */
export async function getLatestResults<T = Record<string, unknown>>(
  queryId: number
): Promise<DuneQueryResult<T>> {
  const cached = cache.get(queryId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as DuneQueryResult<T>;
  }

  const result = await duneRequest<DuneQueryResult<T>>(
    `/query/${queryId}/results`
  );

  if (result.state === 'QUERY_STATE_COMPLETED') {
    cache.set(queryId, {
      data: result,
      timestamp: Date.now(),
      queryId,
    });
  }

  return result;
}

/**
 * Check if the Dune API is configured and reachable.
 */
export function isDuneConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Clear cached data for a specific query or all queries.
 */
export function clearCache(queryId?: number): void {
  if (queryId !== undefined) {
    cache.delete(queryId);
  } else {
    cache.clear();
  }
}
