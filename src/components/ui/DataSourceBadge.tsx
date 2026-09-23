'use client';

import type { DataSource } from '@/lib/types';

const LABELS: Record<DataSource, string> = {
  live: 'Live',
  estimated: 'Estimated',
  mocked: 'Mocked',
};

/** Reads the --badge-* tokens (globals.css) so labels pass AA in light and dark. */
const TONE: Record<DataSource, string> = {
  live: 'text-[color:var(--badge-live-fg)] bg-[var(--badge-live-bg)]',
  estimated: 'text-[color:var(--badge-estimated-fg)] bg-[var(--badge-estimated-bg)]',
  mocked: 'text-[color:var(--badge-mocked-fg)] bg-[var(--badge-mocked-bg)]',
};

interface DataSourceBadgeProps {
  source: DataSource;
  className?: string;
}

export function DataSourceBadge({ source, className = '' }: DataSourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-sans font-medium ${TONE[source]} ${className}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {LABELS[source]}
    </span>
  );
}
