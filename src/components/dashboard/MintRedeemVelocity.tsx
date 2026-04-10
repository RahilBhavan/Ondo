'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { VelocityDataPoint } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatDateShort } from '@/lib/format';

interface MintRedeemVelocityProps {
  data: VelocityDataPoint[];
}

type TokenFilter = 'ALL' | 'OUSG' | 'USDY';

interface AggregatedDay {
  date: string;
  mintVolumeUsd: number;
  redeemVolumeUsd: number;
  netFlow: number;
  mintCount: number;
  redeemCount: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 font-mono mb-2">{formatDateShort(label)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 text-xs font-mono">
          <span className="text-slate-400">{p.name === 'mintVolumeUsd' ? 'Mint' : p.name === 'redeemVolumeUsd' ? 'Redeem' : 'Net'}</span>
          <span className={p.name === 'netFlow' ? (p.value >= 0 ? 'text-accent-green' : 'text-accent-red') : 'text-slate-200'}>
            {formatUsdCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MintRedeemVelocity({ data }: MintRedeemVelocityProps) {
  const [filter, setFilter] = useState<TokenFilter>('ALL');

  const aggregated = useMemo(() => {
    const filtered = filter === 'ALL' ? data : data.filter((d) => d.token === filter);

    const byDate = new Map<string, AggregatedDay>();
    for (const d of filtered) {
      const existing = byDate.get(d.date);
      if (existing) {
        existing.mintVolumeUsd += d.mintVolumeUsd;
        existing.redeemVolumeUsd += d.redeemVolumeUsd;
        existing.mintCount += d.mintCount;
        existing.redeemCount += d.redeemCount;
        existing.netFlow = existing.mintVolumeUsd - existing.redeemVolumeUsd;
      } else {
        byDate.set(d.date, {
          date: d.date,
          mintVolumeUsd: d.mintVolumeUsd,
          redeemVolumeUsd: d.redeemVolumeUsd,
          netFlow: d.mintVolumeUsd - d.redeemVolumeUsd,
          mintCount: d.mintCount,
          redeemCount: d.redeemCount,
        });
      }
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, filter]);

  const filters: TokenFilter[] = ['ALL', 'OUSG', 'USDY'];

  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">
            Mint / Redeem Velocity
          </h3>
          <p className="text-xs text-slate-500 mt-1">90-day rolling volume</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-nexus-bg rounded-md p-0.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  filter === f
                    ? 'bg-nexus-border text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <DataSourceBadge source={data[0]?.dataSource ?? 'mocked'} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={aggregated} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="redeemGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDateShort(v)}
            tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1E293B' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) => formatUsdCompact(v)}
            tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="mintVolumeUsd"
            stroke="#10B981"
            fill="url(#mintGrad)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="redeemVolumeUsd"
            stroke="#F59E0B"
            fill="url(#redeemGrad)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-green" />
          Mints
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-amber" />
          Redemptions
        </div>
      </div>
    </div>
  );
}
