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

const TICK = {
  fill: 'var(--mute)',
  fontSize: 12,
  fontFamily: 'var(--font-geist-mono), monospace',
};

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
    <div className="min-w-[160px] rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-[13px] shadow-[var(--elevation)]">
      <p className="mb-1.5 font-medium text-[color:var(--ink)]">{formatDateShort(label)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span className="text-[color:var(--body)]">{p.name === 'mintVolumeUsd' ? 'Mint' : p.name === 'redeemVolumeUsd' ? 'Redeem' : 'Net'}</span>
          <span className="font-mono tabular-nums text-[color:var(--ink)]">
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
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
            Mint and redeem velocity
          </h3>
          <p className="text-sm text-[color:var(--mute)] mt-1">90-day rolling volume</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Token" className="inline-flex rounded-full border border-[color:var(--hairline)] bg-[var(--canvas)] p-0.5">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`h-8 min-w-[48px] rounded-full px-3 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-[var(--ink)] text-[color:var(--canvas)]'
                    : 'text-[color:var(--body)] hover:text-[color:var(--ink)]'
                }`}
              >
                {f === 'ALL' ? 'All' : f}
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
              <stop offset="5%" style={{ stopColor: 'var(--series-mint)', stopOpacity: 0.2 }} />
              <stop offset="95%" style={{ stopColor: 'var(--series-mint)', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="redeemGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" style={{ stopColor: 'var(--series-redeem)', stopOpacity: 0.2 }} />
              <stop offset="95%" style={{ stopColor: 'var(--series-redeem)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--hairline)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDateShort(v)}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) => formatUsdCompact(v)}
            tick={TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--mute)', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="mintVolumeUsd"
            stroke="var(--series-mint)"
            fill="url(#mintGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="redeemVolumeUsd"
            stroke="var(--series-redeem)"
            fill="url(#redeemGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--body)]">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--series-mint)]" />
          Mints
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--body)]">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--series-redeem)]" />
          Redemptions
        </div>
      </div>
    </div>
  );
}
