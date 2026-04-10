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

interface DataSourceBadgeProps {
  source: DataSource;
  className?: string;
}

export function DataSourceBadge({ source, className = '' }: DataSourceBadgeProps) {
  const { label, color, bg } = CONFIG[source];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${color} ${bg} ${className}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
