import Link from 'next/link';
import { formatUsdCompact, formatNumberCompact, formatPercent } from '@/lib/format';
import { getWeeklyFlows } from '@/lib/weeklyFlows';
import { formatWeek, fourWeekStats, weeklySeries } from '@/lib/flowStats';
import { getChainTVL, toLiquidityCells } from '@/lib/chainSupply';
import { combinedSource } from '@/lib/dataSource';
import { MetricCard } from '@/components/ui/MetricCard';
import { TopHoldersChart } from '@/components/dashboard/TopHoldersChart';
import { FlowCharts } from '@/components/flows/FlowCharts';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { LiquidityHeatmap } from '@/components/dashboard/LiquidityHeatmap';
import { CompetitiveBenchmark } from '@/components/dashboard/CompetitiveBenchmark';
import { getBenchmark, withOnchainOndo } from '@/lib/benchmark';
import { ChainBreakdown } from '@/components/dashboard/ChainBreakdown';
import { MethodologyDrawer } from '@/components/dashboard/MethodologyDrawer';
import { PageShell } from '@/components/ui/PageShell';
import { getTopHolders } from '@/lib/topHolders';

// Chain TVL, top holders and the benchmark read live sources; re-render hourly like /flows.
export const revalidate = 3600;

const NAV_LINKS = [
  { label: 'Instant flows', href: '/flows' },
  { label: 'Methodology', href: '#methodology' },
];

export default async function DashboardPage() {
  // Direct calls, no fetch-to-self (same as src/app/flows/page.tsx); /api/metrics mirrors this.
  const [flows, chainRows, topHolders, benchmark] = await Promise.all([
    getWeeklyFlows(),
    getChainTVL(),
    getTopHolders(),
    getBenchmark(),
  ]);
  const flowsAsOf = flows.rows.reduce((max, r) => (r.asOf > max ? r.asOf : max), '');
  const stats = fourWeekStats(flows.rows);
  // formatPercent keeps one decimal of a percent: anything that rounds to 0.0% is flat.
  const trend = stats.volumeTrend === null ? null : Math.round(stats.volumeTrend * 1000) / 1000;
  const prefix = flows.dataSource === 'mocked' ? '~' : '';
  const totalTvlUsd = chainRows.reduce((sum, r) => sum + r.tvlUsd, 0);
  const tvlSource = combinedSource(chainRows);
  // MetricCard adds '~' itself only when fully mocked; a mixed total needs it too.
  const tvlPrefix = tvlSource === 'estimated' && chainRows.some((r) => r.dataSource === 'mocked') ? '~' : '';

  return (
    <PageShell brand={{ label: 'Nexus adoption intelligence', href: '/' }} links={NAV_LINKS}>
      <section className="space-y-4 pt-10 md:pt-16">
        <h1 className="max-w-[880px] text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-[color:var(--ink)] md:text-[48px] md:leading-[48px] md:tracking-[-2.4px]">
          Institutional adoption of Ondo Nexus.
        </h1>
        <p className="max-w-[640px] text-lg text-[color:var(--body)]">
          OUSG and USDY analytics from Ondo Finance: TVL, chains, liquidity, flows, and competitors.
        </p>
        <p className="text-sm text-[color:var(--mute)]">
          Live data from Dune, Blockscout, DefiLlama and on-chain reads. Each section shows its own date.
        </p>
      </section>

      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total TVL"
            value={`${tvlPrefix}${formatUsdCompact(totalTvlUsd)}`}
            dataSource={tvlSource}
            subValue="13 chains, OUSG + USDY"
          />
          <MetricCard
            label="4-week volume"
            value={formatUsdCompact(stats.volumeUsd)}
            dataSource={flows.dataSource}
            trend={
              trend === null
                ? undefined
                : {
                    direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat',
                    label: `${trend > 0 ? '+' : ''}${formatPercent(trend === 0 ? 0 : trend)} vs prior 4w`,
                  }
            }
          />
          <MetricCard
            label="4-week net flow"
            value={`${stats.netFlowUsd > 0 ? '+' : ''}${formatUsdCompact(stats.netFlowUsd)}`}
            dataSource={flows.dataSource}
            subValue={flowsAsOf ? `Dune, as of ${formatWeek(flowsAsOf)}` : undefined}
          />
          <MetricCard
            label="Avg tx size"
            value={stats.avgTxSizeUsd === null ? 'n/a' : formatUsdCompact(stats.avgTxSizeUsd)}
            dataSource={flows.dataSource}
            subValue={`${formatNumberCompact(stats.txCount)} txns`}
          />
        </div>

        {/* Top holders + Chain — 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <TopHoldersChart data={topHolders.rows} />
          </div>
          <div className="lg:col-span-2">
            <ChainBreakdown data={chainRows} />
          </div>
        </div>

        {/* Heatmap — full width hero */}
        <LiquidityHeatmap data={toLiquidityCells(chainRows)} />

        {/* Weekly flows, last 12 weeks per token — full width */}
        <section className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
                Weekly instant mint and redeem
              </h3>
              <p className="mt-1 text-sm text-[color:var(--mute)]">
                Last 12 weeks{flowsAsOf ? `, as of ${formatWeek(flowsAsOf)}` : ''}.{' '}
                <Link href="/flows" className="text-[color:var(--link)] hover:underline">
                  Full history
                </Link>
              </p>
            </div>
            <DataSourceBadge source={flows.dataSource} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(['OUSG', 'USDY'] as const).map((token) => {
              const series = weeklySeries(flows.rows, token).slice(-12);
              return (
                <div key={token}>
                  <p className="mb-2 text-sm font-medium text-[color:var(--ink)]">{token}</p>
                  <FlowCharts
                    token={token}
                    data={series}
                    asOf={series[series.length - 1]?.asOf ?? ''}
                    prefix={prefix}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Benchmark — full width */}
        <CompetitiveBenchmark data={withOnchainOndo(benchmark.rows, chainRows)} />

        <MethodologyDrawer />
      </div>

      <footer className="border-t border-[color:var(--hairline)] py-8 text-sm text-[color:var(--mute)]">
        Ondo Nexus Adoption Intelligence Dashboard, open source portfolio project. Source on{' '}
        <a href="https://github.com/RahilBhavan/Ondo" className="text-[color:var(--link)] hover:underline">
          GitHub
        </a>
        .
      </footer>
    </PageShell>
  );
}
