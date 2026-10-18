import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/ui/PageShell';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { ChainTable } from '@/components/issuance/ChainTable';
import { Figure1, Figure2 } from '@/components/issuance/IssuanceFigures';
import { TotalsTable } from '@/components/issuance/TotalsTable';
import { NEWS_EVENTS, PRE_WEEKS, TAIL_WEEKS, eventWindow, issuanceSummary, totals } from '@/lib/issuance';
import { formatUsdCompact } from '@/lib/format';
import { formatWeek } from '@/lib/flowStats';

export const metadata: Metadata = {
  title: 'Stablecoin and Treasury-fund flows',
  description: 'Weekly mints and redemptions for USDC, USDT, PYUSD, BUIDL, OUSG and USDY, by chain and around Fed rate cuts.',
};

const LINKS = [
  { label: 'Ondo flows', href: '/flows' },
  { label: 'One-page summary', href: '/summary' },
  { label: 'Methodology', href: '#methodology' },
];

const h2 = 'text-2xl font-semibold tracking-[-0.96px] text-[color:var(--ink)]';
const cap = 'max-w-[720px] text-sm leading-relaxed text-[color:var(--mute)]';
const money = (v: number | null) => (v === null ? 'n/a' : formatUsdCompact(v));

export default function IssuancePage() {
  const s = issuanceSummary();
  return (
    <PageShell brand={{ label: 'Stablecoin flows', href: '/issuance' }} links={LINKS}>
      <section className="space-y-4 pt-10 md:pt-16">
        <h1 className="max-w-[880px] text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-[color:var(--ink)] md:text-[48px] md:leading-[48px] md:tracking-[-2.4px]">
          {formatUsdCompact(s.grossUsd)} minted and redeemed across five issuers.
        </h1>
        <p className="max-w-[680px] text-lg text-[color:var(--body)]">
          Circle, Tether, PayPal, BlackRock and Ondo, on Ethereum since January 2023. Where the money sits by chain, and what
          weekly issuance did around the Fed&apos;s rate cuts.
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--mute)]">
          <DataSourceBadge source="live" />
          <span>Event logs read {formatWeek(s.asOf)}, through the week of {formatWeek(s.lastWeek)}</span>
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="totals-heading">
        <h2 id="totals-heading" className={h2}>
          Mints and redemptions by asset
        </h2>
        <TotalsTable rows={totals()} />
        <p className={cap}>
          Ethereum event logs. Circle CCTP transfers ({formatUsdCompact(s.cctpBridgedUsd)} of USDC mints and burns) are excluded: moving USDC between chains is not
          issuance. USDC is {Math.round(s.usdcShareOfGross * 100)}% of the total and is mostly market-maker churn; its net is negative on Ethereum because holders
          redeem there and mint natively elsewhere, while its circulating supply on all chains grew.
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="fig1-heading">
        <h2 id="fig1-heading" className={h2}>
          Cumulative net issuance
        </h2>
        <Figure1 />
        <p className={cap}>
          Cumulative net issuance since January 2023 (since launch for later assets). Stablecoins: change in circulating supply on every chain. BUIDL, OUSG, USDY:
          Ethereum mints less redemptions. Each panel has its own dollar scale. Shaded: Fed easing episodes, from the first cut to {TAIL_WEEKS} weeks after the last. Ticks: each cut.
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="fig2-heading">
        <h2 id="fig2-heading" className={h2}>
          Around the rate cuts
        </h2>
        <div className="max-w-[720px]">
          <Figure2 />
        </div>
        <p className={cap}>
          Mean weekly net issuance in the {PRE_WEEKS} weeks before an easing episode (open dot) and during it (solid dot), in standard deviations of that asset&apos;s own weekly
          net issuance across the sample. Hover a dot for dollars. Two episodes, so this describes what happened and does not test a cause. USDY&apos;s InstantManager
          began in December 2025, after both episodes started.
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="chains-heading">
        <h2 id="chains-heading" className={h2}>
          Which chains
        </h2>
        <ChainTable />
        <p className={cap}>
          Circulating supply by chain, DefiLlama. Gross mints and redemptions above are Ethereum only, so this is where the flows would land, not where they were counted. Ondo&apos;s
          13-chain split is on the <Link href="/" className="text-[color:var(--link)] hover:underline">home page</Link>; BUIDL has no cited per-chain count.
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="news-heading">
        <h2 id="news-heading" className={h2}>
          News events
        </h2>
        <table className="w-full max-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--ink)] text-left text-xs text-[color:var(--mute)]">
              <th className="py-1.5 pr-4 font-medium">Event</th>
              <th className="py-1.5 pr-4 font-medium">Asset</th>
              <th className="py-1.5 pr-4 text-right font-medium">4 weeks before, per week</th>
              <th className="py-1.5 text-right font-medium">4 weeks from, per week</th>
            </tr>
          </thead>
          <tbody>
            {NEWS_EVENTS.flatMap((e) =>
              e.assets.map((a, i) => {
                const w = eventWindow(a, e.date);
                return (
                  <tr key={`${e.date}${a}`} className="border-b border-[color:var(--hairline)]">
                    <td className="py-2 pr-4 text-[color:var(--body)]">{i === 0 ? `${formatWeek(e.date)}: ${e.label}` : ''}</td>
                    <td className="py-2 pr-4 font-medium text-[color:var(--ink)]">{a}</td>
                    <td className="py-2 pr-4 text-right font-mono text-[13px] tabular-nums">{money(w.before)}</td>
                    <td className="py-2 text-right font-mono text-[13px] tabular-nums text-[color:var(--ink)]">{money(w.after)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className={cap}>Mean weekly change in circulating supply, all chains. The Silicon Valley Bank week is the clearest break in the sample.</p>
      </section>

      <section id="methodology" aria-labelledby="methodology-heading" className="scroll-mt-20 space-y-4">
        <h2 id="methodology-heading" className={h2}>
          Methodology
        </h2>
        <ul className="max-w-[760px] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[color:var(--body)]">
          <li>
            A mint is supply created and a redemption is supply destroyed, read from each token&apos;s Ethereum events: USDC <code className="font-mono text-[13px]">Mint</code>/<code className="font-mono text-[13px]">Burn</code>, USDT{' '}
            <code className="font-mono text-[13px]">Issue</code>/<code className="font-mono text-[13px]">Redeem</code>, PYUSD <code className="font-mono text-[13px]">Transfer</code> from or to the zero address, BUIDL <code className="font-mono text-[13px]">Issue</code>/<code className="font-mono text-[13px]">Burn</code>, OUSG and USDY as on the flows page. Weeks start Monday 00:00 UTC.
          </li>
          <li>Circle CCTP mints and burns, and Paxos&apos;s mistaken 300 trillion PYUSD mint and burn on 2025-10-15, are excluded.</li>
          <li>Ethereum only. Tron carries about half of USDT supply, so Ethereum gross flows understate Tether&apos;s total issuance; the net comparison uses circulating supply on all chains.</li>
          <li>BUIDL mints include about 1% in daily dividend issuance. Fed dates are effective dates from FRED.</li>
          <li>
            Data are dated snapshots written by <code className="font-mono text-[13px]">scripts/backfill-issuance.mjs</code>, not read on page load. Full definitions: <code className="font-mono text-[13px]">docs/METHODOLOGY.md</code>, Pillar 5, and ADR-009.
          </li>
        </ul>
      </section>

      <footer className="border-t border-[color:var(--hairline)] py-8 text-sm text-[color:var(--mute)]">
        Event logs via Tenderly&apos;s public gateway, supply from DefiLlama, rates from FRED.
      </footer>
    </PageShell>
  );
}
