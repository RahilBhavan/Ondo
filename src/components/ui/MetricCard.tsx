'use client';

import type { DataSource } from '@/lib/types';
import { DataSourceBadge } from './DataSourceBadge';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  dataSource: DataSource;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
  };
}

const TREND_STYLES = {
  up: 'text-[color:var(--badge-live-fg)]',
  down: 'text-[color:var(--series-redeem)]',
  flat: 'text-[color:var(--mute)]',
} as const;

const TREND_ARROWS = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2192',
} as const;

export function MetricCard({ label, value, subValue, dataSource, trend }: MetricCardProps) {
  const prefix = dataSource === 'mocked' ? '~' : '';

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[color:var(--mute)]">{label}</span>
        <DataSourceBadge source={dataSource} />
      </div>
      <div className="text-2xl font-semibold tracking-[-0.96px] tabular-nums text-[color:var(--ink)] mb-1">
        {prefix}{value}
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-[13px] font-medium ${TREND_STYLES[trend.direction]}`}>
            {TREND_ARROWS[trend.direction]} {trend.label}
          </span>
        )}
        {subValue && (
          <span className="text-[13px] text-[color:var(--mute)]">{subValue}</span>
        )}
      </div>
    </div>
  );
}
