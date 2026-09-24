import { MOCK_DATA } from '@/lib/mockData';
import Link from 'next/link';
import { formatUsdCompact, formatNumberCompact, formatPercent, relativeTime } from '@/lib/format';
import { getWeeklyFlows } from '@/lib/weeklyFlows';
import { fourWeekStats, weeklySeries } from '@/lib/flowStats';
import { MetricCard } from '@/components/ui/MetricCard';
import { TVLByIssuerChart } from '@/components/dashboard/TVLByIssuerChart';
import { FlowCharts } from '@/components/flows/FlowCharts';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { LiquidityHeatmap } from '@/components/dashboard/LiquidityHeatmap';
import { CompetitiveBenchmark } from '@/components/dashboard/CompetitiveBenchmark';
import { ChainBreakdown } from '@/components/dashboard/ChainBreakdown';
import { MethodologyDrawer } from '@/components/dashboard/MethodologyDrawer';
import { PageShell } from '@/components/ui/PageShell';
import type { DashboardData } from '@/lib/types';

export const revalidate = 3600;

const NAV_LINKS = [
  { label: 'Instant flows', href: '/flows' },
  { label: 'Methodology', href: '#methodology' },
];

async function getDashboardData(): Promise<DashboardData> {
  // Server component — fetch from internal API route.
  // In production, this would call the API route with proper base URL.
  // For now, use mock data directly to avoid fetch-to-self in SSR.
  return MOCK_DATA;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { metrics } = data;
  // Direct call, no fetch-to-self (same as src/app/flows/page.tsx).
  const flows = await getWeeklyFlows();
  const flowsAsOf = flows.rows.reduce((max, r) => (r.asOf > max ? r.asOf : max), '');
  const stats = fourWeekStats(flows.rows);
  const trend = stats.volumeTrend;
  const prefix = flows.dataSource === 'mocked' ? '~' : '';

  return (
    <PageShell brand={{ label: 'Nexus adoption intelligence', href: '/' }} links={NAV_LINKS}>
      <section className="space-y-4 pt-10 md:pt-16">
        <h1 className="max-w-[880px] text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-[color:var(--ink)] md:text-[48px] md:leading-[48px] md:tracking-[-2.4px]">
          Institutional adoption of Ondo Nexus.
        </h1>
        <p className="max-w-[640px] text-lg text-[color:var(--body)]">
          OUSG and USDY analytics from Ondo Finance: TVL, chains, liquidity, flows, and competitors.
        </p>
        <p className="text-sm text-[color:var(--mute)]">Updated {relativeTime(flowsAsOf)}</p>
      </section>

      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total TVL"
            value={formatUsdCompact(metrics.totalTvlUsd)}
            dataSource="mocked"
            trend={{ direction: 'up', label: '+12.3% 30d' }}
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
                    label: `${trend > 0 ? '+' : ''}${formatPercent(trend)} vs prior 4w`,
                  }
            }
          />
          <MetricCard
            label="4-week net flow"
            value={`${stats.netFlowUsd > 0 ? '+' : ''}${formatUsdCompact(stats.netFlowUsd)}`}
            dataSource={flows.dataSource}
          />
          <MetricCard
            label="Avg tx size"
            value={stats.avgTxSizeUsd === null ? 'n/a' : formatUsdCompact(stats.avgTxSizeUsd)}
            dataSource={flows.dataSource}
            subValue={`${formatNumberCompact(stats.txCount)} txns`}
          />
        </div>

        {/* TVL + Chain — 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <TVLByIssuerChart data={data.issuerMetrics} />
          </div>
          <div className="lg:col-span-2">
            <ChainBreakdown data={data.chainBreakdown} />
          </div>
        </div>

        {/* Heatmap — full width hero */}
        <LiquidityHeatmap data={data.liquidityCells} />

        {/* Weekly flows, last 12 weeks per token — full width */}
        <section className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
                Weekly instant mint and redeem
              </h3>
              <p className="mt-1 text-sm text-[color:var(--mute)]">
                Last 12 weeks.{' '}
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
        <CompetitiveBenchmark data={data.competitorBenchmark} />

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
