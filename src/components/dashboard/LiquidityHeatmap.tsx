'use client';

import { useMemo } from 'react';
import type { LiquidityCell, Chain, DataSource } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact } from '@/lib/format';

interface LiquidityHeatmapProps {
  data: LiquidityCell[];
}

const CHAIN_ORDER: Chain[] = [
  'ethereum', 'mantle', 'arbitrum', 'polygon', 'solana',
  'sui', 'aptos', 'noble', 'stellar', 'plume', 'sei', 'bnb', 'xrp-ledger',
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
  bnb: 'BNB',
  'xrp-ledger': 'XRP',
};

/** Single-hue ramp: --link mixed into --canvas. Capped at 60% so ink labels stay legible in light and dark. */
function heat(pct: number): string {
  return `color-mix(in srgb, var(--link) ${pct}%, var(--canvas))`;
}

function getHeatColor(value: number, max: number): string {
  if (value === 0) return 'var(--canvas-soft)';
  return heat(Math.round(Math.max(0.08, Math.min(1, value / max)) * 60));
}

export function LiquidityHeatmap({ data }: LiquidityHeatmapProps) {
  const { issuers, cellMap, maxVal, sources } = useMemo(() => {
    const issuerSet = new Set<string>();
    const sourceSet = new Set<DataSource>();
    const map = new Map<string, LiquidityCell>();
    let max = 0;

    for (const cell of data) {
      issuerSet.add(cell.issuer);
      sourceSet.add(cell.dataSource);
      map.set(`${cell.issuer}:${cell.chain}`, cell);
      if (cell.tvlUsd > max) max = cell.tvlUsd;
    }

    return {
      issuers: Array.from(issuerSet).sort(),
      cellMap: map,
      maxVal: max,
      sources: Array.from(sourceSet),
    };
  }, [data]);

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
            Liquidity depth heatmap
          </h3>
          <p className="text-sm text-[color:var(--mute)] mt-1">Token x chain TVL from on-chain supply</p>
        </div>
        <div className="flex items-center gap-2">
          {sources.map((s) => (
            <DataSourceBadge key={s} source={s} />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            {CHAIN_ORDER.map((chain) => (
              <div
                key={chain}
                className="flex-1 text-center text-xs font-mono uppercase text-[color:var(--mute)] pb-2"
              >
                {CHAIN_LABELS[chain]}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {issuers.map((issuer) => (
            <div key={issuer} className="flex mb-1">
              <div className="w-24 shrink-0 text-sm text-[color:var(--body)] flex items-center pr-2 truncate">
                {issuer}
              </div>
              {CHAIN_ORDER.map((chain) => {
                const cell = cellMap.get(`${issuer}:${chain}`);
                const value = cell?.tvlUsd ?? 0;
                const isMocked = cell?.dataSource === 'mocked';

                return (
                  <div
                    key={chain}
                    className="flex-1 mx-0.5 rounded-[4px] flex items-center justify-center h-12 border border-[color:var(--hairline)] relative group cursor-default"
                    style={{ backgroundColor: getHeatColor(value, maxVal) }}
                  >
                    <span className="text-xs font-mono tabular-nums text-[color:var(--ink)]">
                      {value === 0 ? '–' : `${isMocked ? '~' : ''}${formatUsdCompact(value)}`}
                    </span>

                    {/* Tooltip on hover */}
                    {cell && (
                      <div className="absolute bottom-full inset-x-0 mx-auto w-max mb-2 hidden group-hover:block z-10">
                        <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] px-3 py-2 shadow-[var(--elevation)] whitespace-nowrap">
                          <p className="text-[13px] font-medium text-[color:var(--ink)]">
                            {issuer} on {CHAIN_LABELS[chain]}
                          </p>
                          <p className="mb-1 font-mono text-[13px] tabular-nums text-[color:var(--ink)]">
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
        <span className="text-xs text-[color:var(--mute)]">$0</span>
        <div className="flex h-2 w-32 rounded-[2px] overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: heat(Math.round(((i + 1) / 8) * 60)) }}
            />
          ))}
        </div>
        <span className="text-xs text-[color:var(--mute)]">{formatUsdCompact(maxVal)}</span>
      </div>
    </div>
  );
}
