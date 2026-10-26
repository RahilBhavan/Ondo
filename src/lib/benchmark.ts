/**
 * Competitive benchmark (Pillar 4): TVL per product.
 *
 * DefiLlama no longer serves TVL for its RWA slugs on the free API: both /tvl/<slug> and
 * /protocol/<slug> return 0 or empty series for ondo-yield-assets, invesco-ustb,
 * openeden-tbill and blackrock-buidl (checked 2026-10-24; their TVL moved to the keyed RWA
 * dashboard). The one free live source is the stablecoin endpoint, which lists BUIDL:
 * GET stablecoins.llama.fi/stablecoincharts/all?stablecoin=173, last point's total
 * circulating USD, cached 1h by the Next fetch cache. Ondo's row is replaced by the on-chain
 * total (withOnchainOndo); USTB and TBILL keep their last good rows (src/data/last-good.json,
 * labeled cached with the date of the read) because no free live source exists. A failed BUIDL
 * fetch also falls back to its last good row.
 * Chain count and redemption text always come from the static row, cited to issuer docs.
 */

import { combinedSource, cachedAsOf } from './dataSource';
import { asCached, LAST_GOOD } from './lastGood';
import type { ChainTVL, CompetitorMetric, DataSource, Protocol } from './types';

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

/** Protocols with a free live source, mapped to their DefiLlama stablecoin id. */
export const STABLECOIN_IDS: Partial<Record<Protocol, { id: number; page: string }>> = {
  'blackrock-buidl': { id: 173, page: 'https://defillama.com/stablecoin/blackrock-usd-buidl' },
};

/**
 * Build a live row from a TVL on top of the static fallback row.
 * Throws when the TVL is not a positive finite number.
 */
export function mapBenchmarkRow(
  fallback: CompetitorMetric,
  tvl: unknown,
  asOf: string,
  source = `https://defillama.com/protocol/${DEFILLAMA_SLUGS[fallback.protocol]}`
): CompetitorMetric {
  if (typeof tvl !== 'number' || !Number.isFinite(tvl) || tvl <= 0) {
    throw new Error(`bad tvl value: ${String(tvl)}`);
  }
  return { ...fallback, tvlUsd: tvl, dataSource: 'live', asOf, source };
}

/** Latest total circulating USD from a stablecoincharts/all series. Throws on a bad shape. */
export function latestStablecoinUsd(body: unknown): number {
  const last = Array.isArray(body) ? body[body.length - 1] : undefined;
  const v = last?.totalCirculatingUSD?.peggedUSD;
  if (typeof v !== 'number') throw new Error('stablecoin series has no totalCirculatingUSD.peggedUSD');
  return v;
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
  const live = STABLECOIN_IDS[fallback.protocol];
  if (!live) return fallback; // no free live source: the last good row stands
  try {
    const res = await fetchJson(`https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=${live.id}`);
    return mapBenchmarkRow(fallback, latestStablecoinUsd(res.body), new Date(res.date ?? Date.now()).toISOString(), live.page);
  } catch (err) {
    console.warn(
      `[benchmark] using last good row for ${fallback.protocol}: ${err instanceof Error ? err.message : String(err)}`
    );
    return fallback;
  }
}

export async function getBenchmark(): Promise<BenchmarkResult> {
  const rows = await Promise.all(asCached(LAST_GOOD.competitorBenchmark).map(getRow));
  return { rows, dataSource: combinedSource(rows) };
}

/**
 * Ondo row TVL = the on-chain total from getChainTVL, so the benchmark matches the Total TVL KPI.
 * The row is live when every chain row is live; otherwise it carries the combined label and the
 * oldest cached date. With no chain rows the DefiLlama (or last good) row stays.
 */
export function withOnchainOndo(rows: CompetitorMetric[], chainRows: ChainTVL[]): CompetitorMetric[] {
  if (chainRows.length === 0) return rows;
  const tvlUsd = chainRows.reduce((sum, r) => sum + r.tvlUsd, 0);
  const dataSource = combinedSource(chainRows);
  const asOf = cachedAsOf(chainRows) ?? chainRows.reduce((max, r) => (r.asOf > max ? r.asOf : max), '');
  return rows.map((r) =>
    r.protocol === 'nexus' ? { ...r, tvlUsd, dataSource, asOf, source: 'https://docs.ondo.finance/addresses' } : r
  );
}
