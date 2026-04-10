'use client';

import type { ChainTVL } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatPercent } from '@/lib/format';

interface ChainBreakdownProps {
  data: ChainTVL[];
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  mantle: '#000000',
  arbitrum: '#28A0F0',
  polygon: '#8247E5',
  solana: '#14F195',
  sui: '#6FBCF0',
  aptos: '#2ED8A3',
};

export function ChainBreakdown({ data }: ChainBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.tvlUsd - a.tvlUsd);
  const totalTvl = sorted.reduce((sum, d) => sum + d.tvlUsd, 0);

  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">
          Chain Breakdown
        </h3>
        <DataSourceBadge source={sorted[0]?.dataSource ?? 'mocked'} />
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
                backgroundColor: CHAIN_COLORS[chain.chain] ?? '#64748B',
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
          const isMocked = chain.dataSource === 'mocked';
          return (
            <div key={chain.chain} className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CHAIN_COLORS[chain.chain] ?? '#64748B' }}
                />
                <span className="text-slate-300 capitalize">{chain.chain}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{formatPercent(pct)}</span>
                <span className="text-slate-300 w-16 text-right">
                  {isMocked ? '~' : ''}{formatUsdCompact(chain.tvlUsd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Holder stats */}
      <div className="mt-4 pt-3 border-t border-nexus-border/50 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Holders</p>
          <p className="text-sm font-mono text-slate-200">
            {sorted.reduce((sum, d) => sum + d.holderCount, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">30d Transactions</p>
          <p className="text-sm font-mono text-slate-200">
            {sorted.reduce((sum, d) => sum + d.txCount30d, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
