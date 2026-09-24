import type { DataSource, Sourced } from './types';

/** One badge for many rows: live if all live, mocked if all mocked, else estimated. */
export function combinedSource(rows: Sourced[]): DataSource {
  if (rows.length > 0 && rows.every((r) => r.dataSource === 'live')) return 'live';
  if (rows.every((r) => r.dataSource === 'mocked')) return 'mocked';
  return 'estimated';
}
