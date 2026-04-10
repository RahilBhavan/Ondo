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
  up: 'text-accent-green',
  down: 'text-accent-red',
  flat: 'text-slate-400',
} as const;

const TREND_ARROWS = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2192',
} as const;

export function MetricCard({ label, value, subValue, dataSource, trend }: MetricCardProps) {
  const prefix = dataSource === 'mocked' ? '~' : '';

  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5 hover:border-nexus-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        <DataSourceBadge source={dataSource} />
      </div>
      <div className="text-2xl font-mono font-semibold text-slate-100 mb-1">
        {prefix}{value}
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-xs font-mono ${TREND_STYLES[trend.direction]}`}>
            {TREND_ARROWS[trend.direction]} {trend.label}
          </span>
        )}
        {subValue && (
          <span className="text-xs text-slate-500">{subValue}</span>
        )}
      </div>
    </div>
  );
}
