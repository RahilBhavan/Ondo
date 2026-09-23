'use client';

import { useMemo, useState } from 'react';
import type { DataSource, WeeklyFlow } from '@/lib/types';
import { formatNumberCompact, formatPercent, formatUsd, formatUsdCompact } from '@/lib/format';
import { formatWeek, growth12w, isCompleteWeek, weeklySeries } from '@/lib/flowStats';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { FlowCharts } from './FlowCharts';

const RANGES = [
  { id: '12W', label: '12W', weeks: 12 },
  { id: '52W', label: '52W', weeks: 52 },
  { id: 'ALL', label: 'All', weeks: Infinity },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

const TOKENS: WeeklyFlow['token'][] = ['OUSG', 'USDY'];

interface FlowsExplorerProps {
  rows: WeeklyFlow[];
  dataSource: DataSource;
}

export function FlowsExplorer({ rows, dataSource }: FlowsExplorerProps) {
  const [range, setRange] = useState<RangeId>('52W');
  const weeks = RANGES.find((r) => r.id === range)!.weeks;
  const prefix = dataSource === 'mocked' ? '~' : '';

  return (
    <>
      <div
        role="group"
        aria-label="Time range"
        className="inline-flex rounded-full border border-[color:var(--hairline)] bg-[var(--canvas)] p-0.5"
      >
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={range === r.id}
            onClick={() => setRange(r.id)}
            className={`h-8 min-w-[48px] rounded-full px-3 text-sm font-medium transition-colors ${
              range === r.id
                ? 'bg-[var(--ink)] text-[color:var(--canvas)]'
                : 'text-[color:var(--body)] hover:text-[color:var(--ink)]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {TOKENS.map((token) => (
        <TokenSection key={token} token={token} rows={rows} weeks={weeks} dataSource={dataSource} />
      ))}
    </>
  );
}

interface TokenSectionProps {
  token: WeeklyFlow['token'];
  rows: WeeklyFlow[];
  weeks: number;
  dataSource: DataSource;
}

function TokenSection({ token, rows, weeks, dataSource }: TokenSectionProps) {
  const prefix = dataSource === 'mocked' ? '~' : '';
  const series = useMemo(() => weeklySeries(rows, token), [rows, token]);
  const visible = useMemo(
    () => (Number.isFinite(weeks) ? series.slice(-weeks) : series),
    [series, weeks]
  );
  const asOf = series[series.length - 1]?.asOf ?? '';
  const hasEvents = visible.some((r) => r.mintCount + r.redeemCount > 0);
  const lastComplete = [...visible].reverse().find((r) => isCompleteWeek(r.week, asOf));
  const growth = growth12w(series, asOf);

  return (
    <section aria-labelledby={`${token}-heading`} className="space-y-6">
      <h2
        id={`${token}-heading`}
        className="text-2xl font-semibold tracking-[-0.96px] text-[color:var(--ink)]"
      >
        {token}
      </h2>

      {!hasEvents ? (
        <p className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] px-6 py-10 text-sm text-[color:var(--body)]">
          No instant mint or redeem events in this range.
        </p>
      ) : (
        <>
          {lastComplete && (
            <div className="space-y-3">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--mute)]">
                <DataSourceBadge source={dataSource} tone="page" />
                <span>Week of {formatWeek(lastComplete.week)}, last complete week</span>
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                <Figure label="Mint" value={`${prefix}${formatUsdCompact(lastComplete.mintVolumeUsd)}`} />
                <Figure label="Redeem" value={`${prefix}${formatUsdCompact(lastComplete.redeemVolumeUsd)}`} />
                <Figure
                  label="Net flow"
                  value={`${prefix}${lastComplete.netFlowUsd > 0 ? '+' : ''}${formatUsdCompact(lastComplete.netFlowUsd)}`}
                />
                <Figure label="Unique wallets" value={`${prefix}${lastComplete.uniqueWallets}`} />
              </dl>
              {growth !== null && (
                <p className="text-sm text-[color:var(--body)]">
                  Total volume{' '}
                  <span className="font-medium text-[color:var(--ink)]">
                    {prefix}
                    {growth > 0 ? '+' : ''}
                    {formatPercent(growth)}
                  </span>{' '}
                  vs prior 12 weeks
                </p>
              )}
            </div>
          )}

          <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-4 shadow-[var(--elevation)] md:p-6">
            <FlowCharts token={token} data={visible} asOf={asOf} prefix={prefix} />
          </div>

          <details className="group min-w-0 rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)]">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-[color:var(--ink)]">
              View as table
            </summary>
            <div className="overflow-x-auto border-t border-[color:var(--hairline)]">
              <table className="w-full min-w-[640px] font-mono text-[13px] tabular-nums">
                <thead>
                  <tr className="text-left text-[color:var(--mute)]">
                    {['Week', 'Mint', 'Redeem', 'Net', 'Mints', 'Redeems', 'Wallets'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-4 py-2 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[color:var(--body)]">
                  {[...visible].reverse().map((r) => (
                    <tr key={r.week} className="border-t border-[color:var(--hairline)]">
                      <td className="whitespace-nowrap px-4 py-2 text-[color:var(--ink)]">
                        {r.week}
                        {!isCompleteWeek(r.week, asOf) && (
                          <span className="ml-2 text-[color:var(--mute)]">partial</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatUsd(r.mintVolumeUsd)}`}</td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatUsd(r.redeemVolumeUsd)}`}</td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatUsd(r.netFlowUsd)}`}</td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatNumberCompact(r.mintCount)}`}</td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatNumberCompact(r.redeemCount)}`}</td>
                      <td className="px-4 py-2 text-right">{`${prefix}${formatNumberCompact(r.uniqueWallets)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-[color:var(--mute)]">{label}</dt>
      <dd className="mt-1 truncate text-2xl font-semibold tracking-[-0.96px] tabular-nums text-[color:var(--ink)]">
        {value}
      </dd>
    </div>
  );
}
