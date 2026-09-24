/**
 * Competitive benchmark (Pillar 4): TVL per product from DefiLlama.
 *
 * Live path: GET api.llama.fi/tvl/<slug> (bare USD number) per product, cached 1h by the
 * Next fetch cache. Chain count comes from api.llama.fi/protocol/<slug> `chains`, but only
 * when DefiLlama tracks per-chain TVL (`currentChainTvls` non-empty): for the RWA slugs it
 * is empty and `chains` is a bare ['Ethereum'] placeholder, so the cited static count from
 * the mock row is kept. Redemption text is always the static, cited mock text.
 * A failed fetch for one product falls back to that product's labeled mock row only.
 */

import { MOCK_DATA } from './mockData';
import type { CompetitorMetric, DataSource, Protocol } from './types';

export interface BenchmarkResult {
  rows: CompetitorMetric[];
  /** 'live' only when every row is live; rows carry their own label */
  dataSource: DataSource;
}

/** DefiLlama slug per row. invesco-ustb is USTB only; the `superstate` parent adds USCC. */
export const DEFILLAMA_SLUGS: Record<Protocol, string> = {
  nexus: 'ondo-yield-assets',
  superstate: 'invesco-ustb',
  openeden: 'openeden-tbill',
  'blackrock-buidl': 'blackrock-buidl',
};

const REVALIDATE_SECONDS = 3600;

/**
 * Build a live row from DefiLlama responses on top of the static fallback row.
 * Throws when the TVL is not a positive finite number.
 */
export function mapBenchmarkRow(
  fallback: CompetitorMetric,
  tvl: unknown,
  protocolMeta: unknown,
  asOf: string
): CompetitorMetric {
  if (typeof tvl !== 'number' || !Number.isFinite(tvl) || tvl <= 0) {
    throw new Error(`bad tvl value: ${String(tvl)}`);
  }
  const slug = DEFILLAMA_SLUGS[fallback.protocol];
  const source = `https://defillama.com/protocol/${slug}`;
  const meta = (protocolMeta ?? {}) as { chains?: unknown; currentChainTvls?: unknown };
  const chains = Array.isArray(meta.chains) ? meta.chains : [];
  const tracked = meta.currentChainTvls && typeof meta.currentChainTvls === 'object'
    ? Object.keys(meta.currentChainTvls).length > 0
    : false;
  const liveChains = tracked && chains.length > 0;
  return {
    ...fallback,
    tvlUsd: tvl,
    chainCount: liveChains ? chains.length : fallback.chainCount,
    chainSource: liveChains ? source : fallback.chainSource,
    dataSource: 'live',
    asOf,
    source,
  };
}

async function fetchJson(url: string): Promise<{ body: unknown; date: string | null }> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  // The Date header survives the fetch cache, so it is the real fetch time.
  return { body: await res.json(), date: res.headers.get('date') };
}

async function getRow(fallback: CompetitorMetric): Promise<CompetitorMetric> {
  const slug = DEFILLAMA_SLUGS[fallback.protocol];
  try {
    const [tvl, meta] = await Promise.all([
      fetchJson(`https://api.llama.fi/tvl/${slug}`),
      // Chain metadata is optional: on failure keep the static count.
      fetchJson(`https://api.llama.fi/protocol/${slug}`).catch(() => null),
    ]);
    const asOf = new Date(tvl.date ?? Date.now()).toISOString();
    return mapBenchmarkRow(fallback, tvl.body, meta?.body, asOf);
  } catch (err) {
    console.warn(
      `[benchmark] using mock row for ${slug}: ${err instanceof Error ? err.message : String(err)}`
    );
    return fallback;
  }
}

export async function getBenchmark(): Promise<BenchmarkResult> {
  const rows = await Promise.all(MOCK_DATA.competitorBenchmark.map(getRow));
  return { rows, dataSource: rows.every((r) => r.dataSource === 'live') ? 'live' : 'mocked' };
}
