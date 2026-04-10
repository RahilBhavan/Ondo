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
    <div className="bg-nexus-card border border-nexus-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono text-slate-300 uppercase tracking-wider">
            Competitive Benchmark
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tokenized Treasury protocols
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-nexus-border">
              <th className="text-left text-slate-500 uppercase tracking-wider pb-2 pr-4">Protocol</th>
              <th className="text-right text-slate-500 uppercase tracking-wider pb-2 pr-4">TVL</th>
              <th className="text-right text-slate-500 uppercase tracking-wider pb-2 pr-4">30d Vol</th>
              <th className="text-center text-slate-500 uppercase tracking-wider pb-2 pr-4">Chains</th>
              <th className="text-left text-slate-500 uppercase tracking-wider pb-2 pr-4">Redemption</th>
              <th className="text-center text-slate-500 uppercase tracking-wider pb-2">Source</th>
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
                  className={`border-b border-nexus-border/50 ${isNexus ? 'bg-accent-green-dim/10' : ''}`}
                >
                  <td className="py-3 pr-4">
                    <span className={`${isNexus ? 'text-accent-green font-semibold' : 'text-slate-300'}`}>
                      {row.protocolName}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-nexus-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent-green"
                          style={{ width: `${barWidth}%`, opacity: isNexus ? 1 : 0.5 }}
                        />
                      </div>
                      <span className="text-slate-200 w-16 text-right">
                        {isMocked ? '~' : ''}{formatUsdCompact(row.tvlUsd)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-300">
                    {isMocked ? '~' : ''}{formatUsdCompact(row.volume30dUsd)}
                  </td>
                  <td className="py-3 pr-4 text-center text-slate-300">
                    {row.chainCount}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
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

      <p className="text-[10px] text-slate-600 mt-3">
        Data as of {formatDate(sorted[0]?.sourceDate ?? new Date().toISOString())}. Competitor data may lag.
      </p>
    </div>
  );
}
