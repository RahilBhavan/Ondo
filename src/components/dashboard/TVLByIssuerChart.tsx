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
  OUSG: '#10B981',
  USDY: '#F59E0B',
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: IssuerMetric }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-3 shadow-xl">
      <p className="text-sm font-mono text-slate-200 mb-1">{item.name}</p>
      <p className="text-xs text-slate-400 font-mono mb-1">{item.token}</p>
      <p className="text-sm font-mono text-accent-green">{formatUsd(item.tvlUsd)}</p>
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
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">
            TVL by Issuer
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total: {formatUsdCompact(totalTvl)}
          </p>
        </div>
        <DataSourceBadge source={sorted[0]?.dataSource ?? 'mocked'} />
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatUsdCompact(v)}
            tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1E293B' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#CBD5E1', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.5)' }} />
          <Bar dataKey="tvlUsd" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {sorted.map((entry) => (
              <Cell key={entry.address} fill={TOKEN_COLORS[entry.token] ?? '#10B981'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3 justify-center">
        {Object.entries(TOKEN_COLORS).map(([token, color]) => (
          <div key={token} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {token}
          </div>
        ))}
      </div>
    </div>
  );
}
