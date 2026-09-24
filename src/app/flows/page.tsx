import type { Metadata } from 'next';
import { getWeeklyFlows } from '@/lib/weeklyFlows';
import { formatWeek } from '@/lib/flowStats';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { FlowsExplorer } from '@/components/flows/FlowsExplorer';
import { FlowsMethodology } from '@/components/flows/FlowsMethodology';
import { FlowsShell } from '@/components/flows/FlowsShell';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Ondo instant flows',
  description: 'Weekly OUSG and USDY instant mint and redeem volume and wallets on Ethereum.',
};

export default async function FlowsPage() {
  // Direct call, no fetch-to-self (see src/app/page.tsx).
  const { rows, dataSource, queryUrl } = await getWeeklyFlows();
  const asOf = rows.reduce((max, r) => (r.asOf > max ? r.asOf : max), '');

  return (
    <FlowsShell>
      <section className="space-y-4 pt-10 md:pt-16">
        <h1 className="max-w-[880px] text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-[color:var(--ink)] md:text-[48px] md:leading-[48px] md:tracking-[-2.4px]">
          How much moves through Ondo&apos;s instant mint and redeem each week.
        </h1>
        <p className="max-w-[640px] text-lg text-[color:var(--body)]">
          OUSG and USDY on Ethereum, from InstantManager Subscription and Redemption events.
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--mute)]">
          <DataSourceBadge source={dataSource} />
          {asOf && <span>as of {formatWeek(asOf)}</span>}
          {dataSource === 'live' && queryUrl && (
            <a href={queryUrl} className="text-[color:var(--link)] hover:underline">
              Event logs
            </a>
          )}
        </p>
      </section>

      <FlowsExplorer rows={rows} dataSource={dataSource} />

      <FlowsMethodology />

      <footer className="border-t border-[color:var(--hairline)] py-8 text-sm text-[color:var(--mute)]">
        Data from Ethereum event logs via Blockscout. Source on{' '}
        <a href="https://github.com/RahilBhavan/Ondo" className="text-[color:var(--link)] hover:underline">
          GitHub
        </a>
        .
      </footer>
    </FlowsShell>
  );
}
