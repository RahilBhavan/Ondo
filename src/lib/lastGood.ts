/**
 * Last good values: the fallback when a live source fails.
 *
 * src/data/last-good.json holds real reads, written by scripts/snapshot-last-good.ts from the
 * same getters the pages use. A getter that falls back returns these rows labeled 'cached',
 * keeping the asOf of the original read. Nothing here is invented: when the file has no row,
 * the getter returns no row and the page says the value is unavailable.
 */

import snapshot from '@/data/last-good.json';
import type { ChainTVL, CompetitorMetric, HolderMetric, WeeklyFlow } from './types';

export interface LastGood {
  /** ISO time the file was written; null in a file that has never been refreshed */
  generatedAt: string | null;
  chainTvl: ChainTVL[];
  topHolders: HolderMetric[];
  weeklyFlows: WeeklyFlow[];
  competitorBenchmark: CompetitorMetric[];
}

/** Re-label rows as cached. Their asOf and source stay those of the real read. */
export function asCached<T extends { dataSource: string }>(rows: T[]): (T & { dataSource: 'cached' })[] {
  return rows.map((r) => ({ ...r, dataSource: 'cached' as const }));
}

export const LAST_GOOD = snapshot as unknown as LastGood;
