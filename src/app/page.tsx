import { MOCK_DATA } from '@/lib/mockData';
import { formatUsdCompact, formatNumberCompact, relativeTime } from '@/lib/format';
import { MetricCard } from '@/components/ui/MetricCard';
import { TopHoldersChart } from '@/components/dashboard/TopHoldersChart';
import { MintRedeemVelocity } from '@/components/dashboard/MintRedeemVelocity';
import { LiquidityHeatmap } from '@/components/dashboard/LiquidityHeatmap';
import { CompetitiveBenchmark } from '@/components/dashboard/CompetitiveBenchmark';
import { ChainBreakdown } from '@/components/dashboard/ChainBreakdown';
import { MethodologyDrawer } from '@/components/dashboard/MethodologyDrawer';
import { PageShell } from '@/components/ui/PageShell';
import { getTopHolders } from '@/lib/topHolders';
import type { DashboardData } from '@/lib/types';

// Top holders read Blockscout + the price oracle; both cache for 1hr.
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
  const topHolders = await getTopHolders();

  return (
    <PageShell brand={{ label: 'Nexus adoption intelligence', href: '/' }} links={NAV_LINKS}>
      <section className="space-y-4 pt-10 md:pt-16">
        <h1 className="max-w-[880px] text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-[color:var(--ink)] md:text-[48px] md:leading-[48px] md:tracking-[-2.4px]">
          Institutional adoption of Ondo Nexus.
        </h1>
        <p className="max-w-[640px] text-lg text-[color:var(--body)]">
          OUSG and USDY analytics from Ondo Finance: TVL, chains, liquidity, flows, and competitors.
        </p>
        <p className="text-sm text-[color:var(--mute)]">Updated {relativeTime(metrics.lastUpdated)}</p>
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
            label="Active issuers"
            value={String(metrics.activeIssuers)}
            dataSource="estimated"
            subValue="Across OUSG + USDY"
          />
          <MetricCard
            label="30d volume"
            value={formatUsdCompact(metrics.volume30dUsd)}
            dataSource="mocked"
            trend={{ direction: 'up', label: '+8.7% vs prior' }}
          />
          <MetricCard
            label="Avg tx size"
            value={formatUsdCompact(metrics.avgTxSizeUsd)}
            dataSource="mocked"
            subValue={`${formatNumberCompact(Math.round(metrics.volume30dUsd / metrics.avgTxSizeUsd))} txns`}
          />
        </div>

        {/* Top holders + Chain — 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <TopHoldersChart data={topHolders.rows} />
          </div>
          <div className="lg:col-span-2">
            <ChainBreakdown data={data.chainBreakdown} />
          </div>
        </div>

        {/* Heatmap — full width hero */}
        <LiquidityHeatmap data={data.liquidityCells} />

        {/* Velocity — full width */}
        <MintRedeemVelocity data={data.velocityData} />

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
