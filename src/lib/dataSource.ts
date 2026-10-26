import type { DataSource, Sourced } from './types';

/** One badge for many rows: live if all live, cached if all cached, else estimated. */
export function combinedSource(rows: Sourced[]): DataSource {
  if (rows.length > 0 && rows.every((r) => r.dataSource === 'live')) return 'live';
  if (rows.every((r) => r.dataSource === 'cached')) return 'cached';
  return 'estimated';
}

/** Oldest asOf among the cached rows, or undefined when none is cached. */
export function cachedAsOf(rows: Sourced[]): string | undefined {
  return rows
    .filter((r) => r.dataSource === 'cached')
    .reduce<string | undefined>((min, r) => (min === undefined || r.asOf < min ? r.asOf : min), undefined);
}
