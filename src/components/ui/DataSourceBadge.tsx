'use client';

import type { DataSource } from '@/lib/types';
import { formatDate } from '@/lib/format';

const LABELS: Record<DataSource, string> = {
  live: 'Live',
  estimated: 'Estimated',
  cached: 'Last good',
};

/** Reads the --badge-* tokens (globals.css) so labels pass AA in light and dark. */
const TONE: Record<DataSource, string> = {
  live: 'text-[color:var(--badge-live-fg)] bg-[var(--badge-live-bg)]',
  estimated: 'text-[color:var(--badge-estimated-fg)] bg-[var(--badge-estimated-bg)]',
  cached: 'text-[color:var(--badge-cached-fg)] bg-[var(--badge-cached-bg)]',
};

interface DataSourceBadgeProps {
  source: DataSource;
  /** Date of the real read behind a cached or mixed value; shown as "Last good, <date>". */
  asOf?: string;
  className?: string;
}

export function DataSourceBadge({ source, asOf, className = '' }: DataSourceBadgeProps) {
  const dated = asOf && source !== 'live' ? `, ${formatDate(asOf)}` : '';
  return (
    <span
      title={source === 'cached' ? 'The live source was unavailable. This is the last good value.' : undefined}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-sans font-medium ${TONE[source]} ${className}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {LABELS[source]}
      {dated}
    </span>
  );
}
