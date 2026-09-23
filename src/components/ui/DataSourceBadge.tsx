'use client';

import type { DataSource } from '@/lib/types';

const CONFIG: Record<DataSource, { label: string; color: string; bg: string }> = {
  live: {
    label: 'Live',
    color: 'text-accent-green',
    bg: 'bg-accent-green-dim/30',
  },
  estimated: {
    label: 'Estimated',
    color: 'text-accent-amber',
    bg: 'bg-accent-amber-dim/30',
  },
  mocked: {
    label: 'Mocked',
    color: 'text-slate-400',
    bg: 'bg-slate-700/30',
  },
};

/** 'page' tone reads the /flows CSS variables (globals.css) so labels pass AA in light and dark. */
const PAGE_TONE: Record<DataSource, string> = {
  live: 'text-[color:var(--badge-live-fg)] bg-[var(--badge-live-bg)]',
  estimated: 'text-[color:var(--badge-estimated-fg)] bg-[var(--badge-estimated-bg)]',
  mocked: 'text-[color:var(--badge-mocked-fg)] bg-[var(--badge-mocked-bg)]',
};

interface DataSourceBadgeProps {
  source: DataSource;
  className?: string;
  tone?: 'terminal' | 'page';
}

export function DataSourceBadge({ source, className = '', tone = 'terminal' }: DataSourceBadgeProps) {
  const { label, color, bg } = CONFIG[source];

  if (tone === 'page') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-sans font-medium ${PAGE_TONE[source]} ${className}`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${color} ${bg} ${className}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
