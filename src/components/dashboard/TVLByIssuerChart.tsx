'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { IssuerMetric } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatUsd } from '@/lib/format';

interface TVLByIssuerChartProps {
  data: IssuerMetric[];
}

const TOKEN_COLORS: Record<string, string> = {
  OUSG: 'var(--series-mint)',
  USDY: 'var(--series-redeem)',
};

const TICK = {
  fill: 'var(--mute)',
  fontSize: 12,
  fontFamily: 'var(--font-geist-mono), monospace',
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: IssuerMetric }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="min-w-[160px] rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-[13px] shadow-[var(--elevation)]">
      <p className="font-medium text-[color:var(--ink)]">{item.name}</p>
      <p className="font-mono text-xs text-[color:var(--mute)] mb-1">{item.token}</p>
      <p className="font-mono tabular-nums text-[color:var(--ink)]">{formatUsd(item.tvlUsd)}</p>
      <div className="mt-1">
        <DataSourceBadge source={item.dataSource} />
      </div>
    </div>
  );
}

export function TVLByIssuerChart({ data }: TVLByIssuerChartProps) {
  const sorted = [...data].sort((a, b) => b.tvlUsd - a.tvlUsd);
  const totalTvl = sorted.reduce((sum, d) => sum + d.tvlUsd, 0);

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
            TVL by issuer
          </h3>
          <p className="text-sm text-[color:var(--mute)] mt-1">
            Total: {formatUsdCompact(totalTvl)}
          </p>
        </div>
        <DataSourceBadge source={sorted[0]?.dataSource ?? 'mocked'} />
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 20 }}>
          <CartesianGrid stroke="var(--hairline)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatUsdCompact(v)}
            tick={TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--body)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={160}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--canvas-soft)' }} />
          <Bar dataKey="tvlUsd" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {sorted.map((entry) => (
              <Cell key={entry.address} fill={TOKEN_COLORS[entry.token] ?? 'var(--series-mint)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3 justify-center">
        {Object.entries(TOKEN_COLORS).map(([token, color]) => (
          <div key={token} className="flex items-center gap-1.5 text-[13px] text-[color:var(--body)]">
            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
            {token}
          </div>
        ))}
      </div>
    </div>
  );
}
