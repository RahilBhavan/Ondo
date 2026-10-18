import type { Metadata } from 'next';
import Link from 'next/link';
import { Figure1, Figure2 } from '@/components/issuance/IssuanceFigures';
import { TotalsTable } from '@/components/issuance/TotalsTable';
import { chainShares, eventWindow, issuanceSummary, totals, zDuring } from '@/lib/issuance';
import { formatUsdCompact } from '@/lib/format';
import { formatWeek } from '@/lib/flowStats';

export const metadata: Metadata = {
  title: 'Stablecoin and Treasury-fund issuance around Fed rate cuts',
  description: 'One-page summary: $1 trillion of mints and redemptions across five issuers, by chain and around rate cuts.',
};

const sd = (v: number | null) => (v === null ? 'n/a' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}σ`);
const perWeek = (v: number | null) => (v === null ? 'n/a' : `${formatUsdCompact(v)} a week`);

export default function SummaryPage() {
  const s = issuanceSummary();
  const r = s.episodeResults;
  const [e1, e2] = s.episodes;
  const usdc = chainShares('USDC');
  const usdt = chainShares('USDT');
  const svbUsdc = eventWindow('USDC', '2023-03-11');
  const svbUsdt = eventWindow('USDT', '2023-03-11');
  const share = (c: { chains: { chain: string; share: number }[] }, name: string) => Math.round((c.chains.find((x) => x.chain === name)?.share ?? 0) * 100);
  const pctile = (asset: string, ep: number) => r.find((x) => x.asset === asset && x.episode.firstCut === s.episodes[ep].firstCut)?.percentile ?? null;

  return (
    <div className="min-h-screen bg-[var(--canvas-soft)] py-6 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 11mm 12mm; } @media print { html, body { background: #fff !important; } .sheet { box-shadow: none !important; border: 0 !important; } .no-print { display: none !important; } }`}</style>
      <p className="no-print mx-auto mb-3 max-w-[794px] px-2 text-xs text-[color:var(--mute)]">
        One A4 page. Print or save as PDF from the browser (Ctrl+P, background graphics on).{' '}
        <Link href="/issuance" className="text-[color:var(--link)] hover:underline">Interactive version</Link>
      </p>
      <article className="sheet mx-auto w-[794px] max-w-full border border-[color:var(--hairline)] bg-[var(--canvas)] px-9 py-8 text-[10.5px] leading-[1.45] text-[color:var(--body)] shadow-[var(--elevation)] print:w-full print:p-0">
        <header className="border-b border-[color:var(--ink)] pb-3">
          <h1 className="text-[21px] font-semibold leading-[1.15] tracking-[-0.6px] text-[color:var(--ink)]">
            Fed cuts split stablecoin and Treasury-fund issuance in 2024; 2025 blurred it
          </h1>
          <p className="mt-1.5 text-[10px] text-[color:var(--mute)]">
            Rahil Bhavan · {formatWeek(s.asOf)} · Weekly mints and redemptions of USDC, USDT, PYUSD, BUIDL, OUSG and USDY, January 2023 to {formatWeek(s.lastWeek)}
          </p>
        </header>

        <p className="mt-3 text-[11.5px] leading-[1.5] text-[color:var(--ink)]">
          <strong>Five issuers, {formatUsdCompact(s.grossUsd)} of mints and redemptions on Ethereum.</strong> In the Fed&apos;s two easing episodes the two largest stablecoins
          grew faster than their own norm in 2024 (USDC {sd(zDuring(r, 'USDC', 0))}, USDT {sd(zDuring(r, 'USDT', 0))}) while the Treasury-backed funds ran below theirs (BUIDL {sd(zDuring(r, 'BUIDL', 0))}, OUSG {sd(zDuring(r, 'OUSG', 0))}). 2025 only
          half repeated it: BUIDL fell further ({sd(zDuring(r, 'BUIDL', 1))}, the weakest window in its history) and USDT stayed above average ({sd(zDuring(r, 'USDT', 1))}), but USDC fell back to average and OUSG recovered. With two episodes, this
          is a pattern to watch, not evidence of cause.
        </p>

        <div className="mt-3 grid grid-cols-[1fr] gap-1">
          <p className="text-[10px] font-semibold text-[color:var(--ink)]">
            1. Cumulative net issuance since January 2023, each on its own scale. Shaded: easing episodes; ticks: cuts.
          </p>
          <Figure1 compact />
        </div>

        <div className="mt-3 grid grid-cols-[1.2fr_1fr] gap-5">
          <div>
            <p className="text-[10px] font-semibold text-[color:var(--ink)]">
              2. Mean weekly net issuance before and during each easing episode, in standard deviations of the asset&apos;s own norm.
            </p>
            <Figure2 compact />
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="mb-1 text-[10px] font-semibold text-[color:var(--ink)]">Mints and redemptions, Ethereum</p>
              <TotalsTable rows={totals()} compact />
            </div>
            <p>
              <strong className="text-[color:var(--ink)]">Chains.</strong> USDC: {share(usdc, 'Ethereum')}% on Ethereum, {share(usdc, 'Hyperliquid L1')}% Hyperliquid, {share(usdc, 'Solana')}% Solana. USDT: {share(usdt, 'Tron')}% on Tron, {share(usdt, 'Ethereum')}% Ethereum.
              Ethereum counts therefore understate Tether&apos;s issuance; the net comparison uses supply on every chain.
            </p>
            <p>
              <strong className="text-[color:var(--ink)]">News.</strong> After USDC&apos;s March 2023 depeg its supply fell {perWeek(svbUsdc.after === null ? null : -svbUsdc.after)} for four weeks (it had been growing {perWeek(svbUsdc.before)}) while USDT grew {perWeek(svbUsdt.after)}. After the July 2025 GENIUS Act, USDT growth held ({perWeek(eventWindow('USDT', '2025-07-18').after)}) and USDC slowed ({perWeek(eventWindow('USDC', '2025-07-18').before)} to {perWeek(eventWindow('USDC', '2025-07-18').after)}).
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-5 border-t border-[color:var(--hairline)] pt-2.5 text-[9.5px] leading-[1.4] text-[color:var(--mute)]">
          <p>
            <strong className="text-[color:var(--body)]">Method.</strong> A mint is supply created, a redemption supply destroyed, from each token&apos;s Ethereum events (USDC Mint/Burn, USDT Issue/Redeem, PYUSD and BUIDL transfers and issues, OUSG
            and USDY InstantManager). Circle CCTP transfers ({formatUsdCompact(s.cctpBridgedUsd)}) and Paxos&apos;s mistaken 300 trillion PYUSD mint are excluded. Net issuance: change in supply on all chains (DefiLlama) for the three stablecoins; Ethereum mints less
            redemptions for the funds. Easing episodes group FRED target cuts under 120 days apart: {e1.label} ({e1.bps} bp) and {e2.label} ({e2.bps} bp); compared with the 12 weeks before.
          </p>
          <p>
            <strong className="text-[color:var(--body)]">Limits.</strong> Two episodes and six assets: the percentile of each window against all same-length windows is in the chart tooltips (BUIDL 2025: lowest of its windows ({Math.round((pctile('BUIDL', 1) ?? 0) * 100)}th percentile), USDC 2024: {Math.round((pctile('USDC', 0) ?? 0) * 100)}th),
            but windows overlap in time and other drivers moved together. USDC gross volume is mostly market-maker churn ({Math.round(s.usdcShareOfGross * 100)}% of the total). BUIDL mints include about 1% dividend issuance. USDY starts December 2025. Data are dated snapshots; code and
            definitions at github.com/RahilBhavan/Ondo (docs/METHODOLOGY.md, Pillar 5).
          </p>
        </div>
      </article>
    </div>
  );
}
