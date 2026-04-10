'use client';

import { useMemo } from 'react';
import type { LiquidityCell, Chain } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact } from '@/lib/format';

interface LiquidityHeatmapProps {
  data: LiquidityCell[];
}

const CHAIN_ORDER: Chain[] = [
  'ethereum', 'mantle', 'arbitrum', 'polygon', 'solana',
  'sui', 'aptos', 'noble', 'stellar', 'plume', 'sei', 'xrp-ledger',
];

const CHAIN_LABELS: Record<Chain, string> = {
  ethereum: 'ETH',
  mantle: 'MNT',
  arbitrum: 'ARB',
  polygon: 'POLY',
  solana: 'SOL',
  sui: 'SUI',
  aptos: 'APT',
  noble: 'NOBLE',
  stellar: 'XLM',
  plume: 'PLUME',
  sei: 'SEI',
  'xrp-ledger': 'XRP',
};

function getHeatColor(value: number, max: number): string {
  if (value === 0) return 'rgba(16, 185, 129, 0.03)';
  const intensity = Math.max(0.08, Math.min(0.85, value / max));
  return `rgba(16, 185, 129, ${intensity})`;
}

export function LiquidityHeatmap({ data }: LiquidityHeatmapProps) {
  const { issuers, chains, cellMap, maxVal } = useMemo(() => {
    const issuerSet = new Set<string>();
    const chainSet = new Set<Chain>();
    const map = new Map<string, LiquidityCell>();
    let max = 0;

    for (const cell of data) {
      issuerSet.add(cell.issuer);
      chainSet.add(cell.chain);
      map.set(`${cell.issuer}:${cell.chain}`, cell);
      if (cell.tvlUsd > max) max = cell.tvlUsd;
    }

    const orderedChains = CHAIN_ORDER.filter((c) => chainSet.has(c));
    return {
      issuers: Array.from(issuerSet),
      chains: orderedChains,
      cellMap: map,
      maxVal: max,
    };
  }, [data]);

  return (
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">
            Liquidity Depth Heatmap
          </h3>
          <p className="text-xs text-slate-500 mt-1">Issuer x Chain TVL distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge source="live" />
          <DataSourceBadge source="mocked" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            {chains.map((chain) => (
              <div
                key={chain}
                className="flex-1 text-center text-[10px] font-mono text-slate-500 uppercase tracking-wider pb-2"
              >
                {CHAIN_LABELS[chain]}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {issuers.map((issuer) => (
            <div key={issuer} className="flex mb-1">
              <div className="w-24 shrink-0 text-xs font-mono text-slate-400 flex items-center pr-2 truncate">
                {issuer}
              </div>
              {chains.map((chain) => {
                const cell = cellMap.get(`${issuer}:${chain}`);
                const value = cell?.tvlUsd ?? 0;
                const isMocked = cell?.dataSource === 'mocked';

                return (
                  <div
                    key={chain}
                    className="flex-1 mx-0.5 rounded-sm flex items-center justify-center h-12 border border-nexus-border/50 relative group cursor-default"
                    style={{ backgroundColor: getHeatColor(value, maxVal) }}
                  >
                    <span className="text-[10px] font-mono text-slate-300">
                      {value === 0 ? '-' : `${isMocked ? '~' : ''}${formatUsdCompact(value)}`}
                    </span>

                    {/* Tooltip on hover */}
                    {cell && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-nexus-bg border border-nexus-border rounded-lg p-2 shadow-xl whitespace-nowrap">
                          <p className="text-[10px] font-mono text-slate-300">
                            {issuer} on {CHAIN_LABELS[chain]}
                          </p>
                          <p className="text-xs font-mono text-accent-green">
                            {formatUsdCompact(value)}
                          </p>
                          <DataSourceBadge source={cell.dataSource} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Scale legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[10px] text-slate-500">$0</span>
        <div className="flex h-2 w-32 rounded-sm overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: `rgba(16, 185, 129, ${(i + 1) * 0.1})` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-500">{formatUsdCompact(maxVal)}</span>
      </div>
    </div>
  );
}
