'use client';

import type { Chain, ChainTVL, DataSource } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatPercent } from '@/lib/format';

interface ChainBreakdownProps {
  data: ChainTVL[];
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  mantle: 'var(--ink)',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
  solana: '#14F195',
  sui: '#6FBCF0',
  aptos: '#2ED8A3',
};

interface ChainTotal {
  chain: Chain;
  tvlUsd: number;
  mocked: boolean;
}

/** Sum the per-(token, chain) rows into one entry per chain. */
function byChain(rows: ChainTVL[]): ChainTotal[] {
  const map = new Map<Chain, ChainTotal>();
  for (const r of rows) {
    const t = map.get(r.chain) ?? { chain: r.chain, tvlUsd: 0, mocked: false };
    t.tvlUsd += r.tvlUsd;
    t.mocked ||= r.dataSource === 'mocked';
    map.set(r.chain, t);
  }
  return [...map.values()];
}

function overallSource(rows: ChainTVL[]): DataSource {
  if (rows.length > 0 && rows.every((r) => r.dataSource === 'live')) return 'live';
  if (rows.every((r) => r.dataSource === 'mocked')) return 'mocked';
  return 'estimated';
}

export function ChainBreakdown({ data }: ChainBreakdownProps) {
  const sorted = byChain(data).sort((a, b) => b.tvlUsd - a.tvlUsd);
  const totalTvl = sorted.reduce((sum, d) => sum + d.tvlUsd, 0);

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
          Chain breakdown
        </h3>
        <DataSourceBadge source={overallSource(data)} />
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {sorted.map((chain) => {
          const pct = totalTvl > 0 ? (chain.tvlUsd / totalTvl) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={chain.chain}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${pct}%`,
                backgroundColor: CHAIN_COLORS[chain.chain] ?? 'var(--mute)',
                opacity: 0.8,
              }}
            />
          );
        })}
      </div>

      {/* Chain list */}
      <div className="space-y-2">
        {sorted.map((chain) => {
          const pct = totalTvl > 0 ? chain.tvlUsd / totalTvl : 0;
          return (
            <div key={chain.chain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CHAIN_COLORS[chain.chain] ?? 'var(--mute)' }}
                />
                <span className="text-[color:var(--ink)] capitalize">{chain.chain}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] tabular-nums text-[color:var(--mute)]">
                  {chain.tvlUsd === 0 ? '–' : formatPercent(pct)}
                </span>
                <span className="font-mono text-[13px] tabular-nums text-[color:var(--ink)] w-16 text-right">
                  {chain.tvlUsd === 0 ? '–' : `${chain.mocked ? '~' : ''}${formatUsdCompact(chain.tvlUsd)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
