'use client';

import type { CompetitorMetric } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatDate } from '@/lib/format';

interface CompetitiveBenchmarkProps {
  data: CompetitorMetric[];
}

export function CompetitiveBenchmark({ data }: CompetitiveBenchmarkProps) {
  const sorted = [...data].sort((a, b) => b.tvlUsd - a.tvlUsd);
  const maxTvl = sorted[0]?.tvlUsd ?? 1;

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
            Competitive benchmark
          </h3>
          <p className="text-sm text-[color:var(--mute)] mt-1">
            Tokenized Treasury protocols
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--hairline)]">
              <th className="text-left text-[color:var(--mute)] font-medium pb-2 pr-4">Protocol</th>
              <th className="text-right text-[color:var(--mute)] font-medium pb-2 pr-4">TVL</th>
              <th className="text-right text-[color:var(--mute)] font-medium pb-2 pr-4">30d vol</th>
              <th className="text-center text-[color:var(--mute)] font-medium pb-2 pr-4">Chains</th>
              <th className="text-left text-[color:var(--mute)] font-medium pb-2 pr-4">Redemption</th>
              <th className="text-center text-[color:var(--mute)] font-medium pb-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const barWidth = (row.tvlUsd / maxTvl) * 100;
              const isNexus = row.protocol === 'nexus';
              const isMocked = row.dataSource === 'mocked';

              return (
                <tr
                  key={row.protocol}
                  className={`border-b border-[color:var(--hairline)] last:border-b-0 ${isNexus ? 'bg-[var(--canvas-soft)]' : ''}`}
                >
                  <td className="py-3 pr-4">
                    <span className={`${isNexus ? 'text-[color:var(--ink)] font-semibold' : 'text-[color:var(--body)]'}`}>
                      {row.protocolName}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-[var(--hairline)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--link)]"
                          style={{ width: `${barWidth}%`, opacity: isNexus ? 1 : 0.5 }}
                        />
                      </div>
                      <span className="font-mono text-[13px] tabular-nums text-[color:var(--ink)] w-16 text-right">
                        {isMocked ? '~' : ''}{formatUsdCompact(row.tvlUsd)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-[13px] tabular-nums text-[color:var(--body)]">
                    {isMocked ? '~' : ''}{formatUsdCompact(row.volume30dUsd)}
                  </td>
                  <td className="py-3 pr-4 text-center tabular-nums text-[color:var(--body)]">
                    {row.chainCount}
                  </td>
                  <td className="py-3 pr-4 text-[color:var(--body)]">
                    {row.redemptionSpeed}
                  </td>
                  <td className="py-3 text-center">
                    <DataSourceBadge source={row.dataSource} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[color:var(--mute)] mt-3">
        Data as of {formatDate(sorted[0]?.sourceDate ?? new Date().toISOString())}. Competitor data may lag.
      </p>
    </div>
  );
}
