import { MOCK_DATA } from '@/lib/mockData';
import { formatUsdCompact, formatNumberCompact, relativeTime } from '@/lib/format';
import { MetricCard } from '@/components/ui/MetricCard';
import { TVLByIssuerChart } from '@/components/dashboard/TVLByIssuerChart';
import { MintRedeemVelocity } from '@/components/dashboard/MintRedeemVelocity';
import { LiquidityHeatmap } from '@/components/dashboard/LiquidityHeatmap';
import { CompetitiveBenchmark } from '@/components/dashboard/CompetitiveBenchmark';
import { ChainBreakdown } from '@/components/dashboard/ChainBreakdown';
import { MethodologyDrawer } from '@/components/dashboard/MethodologyDrawer';
import type { DashboardData } from '@/lib/types';

async function getDashboardData(): Promise<DashboardData> {
  // Server component — fetch from internal API route.
  // In production, this would call the API route with proper base URL.
  // For now, use mock data directly to avoid fetch-to-self in SSR.
  return MOCK_DATA;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { metrics } = data;

  return (
    <div className="min-h-screen bg-nexus-bg">
      {/* Top bar */}
      <header className="border-b border-nexus-border px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-mono font-semibold text-slate-100 tracking-tight">
              Nexus Adoption Intelligence
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Ondo Finance — OUSG + USDY Institutional Analytics
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Updated {relativeTime(metrics.lastUpdated)}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total TVL"
            value={formatUsdCompact(metrics.totalTvlUsd)}
            dataSource="mocked"
            trend={{ direction: 'up', label: '+12.3% 30d' }}
          />
          <MetricCard
            label="Active Issuers"
            value={String(metrics.activeIssuers)}
            dataSource="estimated"
            subValue="Across OUSG + USDY"
          />
          <MetricCard
            label="30d Volume"
            value={formatUsdCompact(metrics.volume30dUsd)}
            dataSource="mocked"
            trend={{ direction: 'up', label: '+8.7% vs prior' }}
          />
          <MetricCard
            label="Avg Tx Size"
            value={formatUsdCompact(metrics.avgTxSizeUsd)}
            dataSource="mocked"
            subValue={`${formatNumberCompact(Math.round(metrics.volume30dUsd / metrics.avgTxSizeUsd))} txns`}
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

        {/* Velocity — full width */}
        <MintRedeemVelocity data={data.velocityData} />

        {/* Benchmark — full width */}
        <CompetitiveBenchmark data={data.competitorBenchmark} />
      </main>

      {/* Footer with methodology */}
      <footer className="max-w-[1400px] mx-auto">
        <MethodologyDrawer />
        <div className="px-5 py-3 text-[10px] font-mono text-slate-600 text-center border-t border-nexus-border/50">
          Ondo Nexus Adoption Intelligence Dashboard — Open Source Portfolio Project
        </div>
      </footer>
    </div>
  );
}
