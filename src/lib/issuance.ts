/**
 * Stablecoin and tokenized-fund issuance (the flows tracker): weekly gross mints and redemptions
 * on Ethereum for USDC, USDT, PYUSD, BUIDL, OUSG and USDY, and how they moved around Fed easing.
 *
 * Inputs are three dated snapshots written by scripts/backfill-*.mjs (ADR-009):
 *   issuance.json         event logs decoded from Ethereum (the six assets)
 *   supply-by-chain.json  DefiLlama circulating supply by chain (USDC, USDT, PYUSD)
 *   rates.json            FRED federal funds target (upper bound) and effective rate
 * Everything here is pure, so the page, the write-up and issuance.check.ts all read one set of numbers.
 */

import issuance from '@/data/issuance.json';
import supply from '@/data/supply-by-chain.json';
import rates from '@/data/rates.json';
import { mondayOf } from './flowStats';

export type AssetId = 'USDC' | 'USDT' | 'PYUSD' | 'BUIDL' | 'OUSG' | 'USDY';
export type Group = 'payment' | 'treasury';

export interface AssetMeta {
  id: AssetId;
  issuer: string;
  group: Group;
}

/** Display order: payment stablecoins, then Treasury-backed products. */
export const ASSETS: AssetMeta[] = [
  { id: 'USDC', issuer: 'Circle', group: 'payment' },
  { id: 'USDT', issuer: 'Tether', group: 'payment' },
  { id: 'PYUSD', issuer: 'PayPal (Paxos)', group: 'payment' },
  { id: 'BUIDL', issuer: 'BlackRock (Securitize)', group: 'treasury' },
  { id: 'OUSG', issuer: 'Ondo', group: 'treasury' },
  { id: 'USDY', issuer: 'Ondo', group: 'treasury' },
];

export interface IssuanceRow {
  week: string;
  asset: AssetId;
  mintUsd: number;
  redeemUsd: number;
  bridgeMintUsd: number;
  bridgeRedeemUsd: number;
  mintCount: number;
  redeemCount: number;
}

export interface Week {
  week: string;
  /** New issuance, USD, cross-chain (CCTP) mints removed */
  mint: number;
  /** Redemptions, USD, cross-chain (CCTP) burns removed */
  redeem: number;
  net: number;
  gross: number;
}

export const SNAPSHOT = {
  flowsAsOf: issuance.asOf as string,
  supplyAsOf: supply.asOf as string,
  ratesAsOf: rates.asOf as string,
  flowsStartWeek: mondayOf(issuance.rows.reduce((m, r) => (r.week < m ? r.week : m), '9999-12-31')),
};

/** Older rows (re-run assets only add the bridge fields) default to no bridged volume. */
const ROWS: IssuanceRow[] = (issuance.rows as Array<Partial<IssuanceRow> & IssuanceRow>).map((r) => ({
  ...r,
  bridgeMintUsd: r.bridgeMintUsd ?? 0,
  bridgeRedeemUsd: r.bridgeRedeemUsd ?? 0,
}));
/** The week containing the snapshot is partial: every series stops before it. */
const LAST_COMPLETE_WEEK = (() => {
  const d = new Date(`${mondayOf(issuance.asOf)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
})();

const addWeeks = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return d.toISOString().slice(0, 10);
};

/** Weekly series for one asset from its first event to the last complete week; empty weeks are zero. */
export function weeklySeries(asset: AssetId): Week[] {
  const rows = new Map(ROWS.filter((r) => r.asset === asset).map((r) => [r.week, r]));
  const weeks = [...rows.keys()].sort();
  if (!weeks.length) return [];
  const out: Week[] = [];
  for (let w = weeks[0]; w <= LAST_COMPLETE_WEEK; w = addWeeks(w, 1)) {
    const r = rows.get(w);
    const mint = r ? r.mintUsd - r.bridgeMintUsd : 0;
    const redeem = r ? r.redeemUsd - r.bridgeRedeemUsd : 0;
    out.push({ week: w, mint, redeem, net: mint - redeem, gross: mint + redeem });
  }
  return out;
}

export interface Totals {
  asset: AssetMeta;
  mint: number;
  redeem: number;
  net: number;
  gross: number;
  /** USDC only: cross-chain mints and burns removed from the above */
  bridged: number;
  firstWeek: string;
}

export function totals(): Totals[] {
  return ASSETS.map((asset) => {
    const s = weeklySeries(asset.id);
    const mint = s.reduce((a, w) => a + w.mint, 0);
    const redeem = s.reduce((a, w) => a + w.redeem, 0);
    const bridged = ROWS.filter((r) => r.asset === asset.id && r.week <= LAST_COMPLETE_WEEK).reduce(
      (a, r) => a + r.bridgeMintUsd + r.bridgeRedeemUsd,
      0
    );
    return { asset, mint, redeem, net: mint - redeem, gross: mint + redeem, bridged, firstWeek: s[0]?.week ?? '' };
  });
}

/** Sum of mints plus redemptions over every asset: the number in the headline. */
export const grossIssuerVolume = (): number => totals().reduce((a, t) => a + t.gross, 0);

/**
 * Weekly net issuance used for the rate comparison.
 *  - USDC, USDT, PYUSD: change in circulating supply on all chains (DefiLlama, Monday to Monday). Ethereum
 *    logs alone miss Tron, where most USDT sits, and show USDC moving between chains.
 *  - BUIDL, OUSG, USDY: mints minus redemptions on Ethereum (the logs), since these are issued there.
 * Week w is the change from Monday w to Monday w+1 week.
 */
export function netSeries(asset: AssetId): Array<{ week: string; net: number }> {
  if (asset === 'USDC' || asset === 'USDT' || asset === 'PYUSD') {
    const weeks = [...new Set(SUPPLY.filter((r) => r.asset === asset).map((r) => r.week))].sort();
    const total = new Map(weeks.map((w) => [w, supplyTotalAt(asset, w)]));
    const out: Array<{ week: string; net: number }> = [];
    for (let i = 0; i + 1 < weeks.length; i++) {
      if (weeks[i] > LAST_COMPLETE_WEEK) break;
      // PYUSD is absent before launch (total 0): start at its first nonzero week
      if (!total.get(weeks[i])) continue;
      out.push({ week: weeks[i], net: total.get(weeks[i + 1])! - total.get(weeks[i])! });
    }
    return out;
  }
  return weeklySeries(asset).map((w) => ({ week: w.week, net: w.net }));
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/** Cumulative net issuance from the series' first week, one point per week boundary (starts at 0). */
export function cumulativeNet(asset: AssetId): Array<{ week: string; value: number }> {
  let c = 0;
  const s = netSeries(asset);
  return s.length ? [{ week: s[0].week, value: 0 }, ...s.map((w) => ({ week: addWeeks(w.week, 1), value: (c += w.net) }))] : [];
}

// --- Fed easing ---

export interface RateChange {
  /** Effective date (FRED), YYYY-MM-DD */
  date: string;
  from: number;
  to: number;
}

export const RATE_CHANGES: RateChange[] = rates.changes as RateChange[];
export const CUTS: RateChange[] = RATE_CHANGES.filter((c) => c.to < c.from && c.date >= '2023-01-01');

export interface Episode {
  label: string;
  firstCut: string;
  lastCut: string;
  cuts: number;
  /** Total change in the target's upper bound, percentage points */
  bps: number;
}

/** Cuts less than 120 days apart form one easing episode, so their windows do not overlap. */
export function episodes(): Episode[] {
  const out: Episode[] = [];
  for (const c of CUTS) {
    const last = out[out.length - 1];
    if (last && Date.parse(c.date) - Date.parse(last.lastCut) < 120 * 86_400_000) {
      last.lastCut = c.date;
      last.cuts += 1;
      last.bps += Math.round((c.from - c.to) * 100);
    } else {
      out.push({ label: '', firstCut: c.date, lastCut: c.date, cuts: 1, bps: Math.round((c.from - c.to) * 100) });
    }
  }
  const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return out.map((e) => ({ ...e, label: `${fmt(e.firstCut)} to ${fmt(e.lastCut)}` }));
}

export const PRE_WEEKS = 12;
export const TAIL_WEEKS = 4;

export interface EpisodeResult {
  asset: AssetId;
  episode: Episode;
  /** Mean weekly net issuance over the PRE_WEEKS before the first cut, USD; null when the asset had too little history */
  preUsd: number | null;
  /** Mean weekly net issuance from the first cut through TAIL_WEEKS after the last, USD */
  duringUsd: number | null;
  /** The same two means in standard deviations of the asset's own weekly net issuance (full sample) */
  preZ: number | null;
  duringZ: number | null;
  /** Share of all same-length windows of this asset (outside this episode and its pre-window) with a lower mean */
  percentile: number | null;
}

export function episodeResults(): EpisodeResult[] {
  const eps = episodes();
  const out: EpisodeResult[] = [];
  for (const asset of ASSETS) {
    const s = netSeries(asset.id);
    const nets = s.map((w) => w.net);
    const m = nets.length ? mean(nets) : 0;
    const sd = nets.length ? stdev(nets) : 0;
    const idx = new Map(s.map((w, i) => [w.week, i]));
    for (const episode of eps) {
      const a = idx.get(mondayOf(episode.firstCut));
      const b = idx.get(addWeeks(mondayOf(episode.lastCut), TAIL_WEEKS));
      if (a === undefined || b === undefined || sd === 0) {
        out.push({ asset: asset.id, episode, preUsd: null, duringUsd: null, preZ: null, duringZ: null, percentile: null });
        continue;
      }
      const length = b - a + 1;
      const duringUsd = mean(nets.slice(a, b + 1));
      const preUsd = a >= PRE_WEEKS ? mean(nets.slice(a - PRE_WEEKS, a)) : null;
      let lower = 0;
      let total = 0;
      for (let i = 0; i + length <= nets.length; i++) {
        if (i < b && i + length > a - PRE_WEEKS) continue; // overlaps this episode or its pre-window
        total++;
        if (mean(nets.slice(i, i + length)) < duringUsd) lower++;
      }
      out.push({
        asset: asset.id,
        episode,
        preUsd,
        duringUsd,
        preZ: preUsd === null ? null : (preUsd - m) / sd,
        duringZ: (duringUsd - m) / sd,
        percentile: total >= 8 ? lower / total : null,
      });
    }
  }
  return out;
}

// --- Chains ---

interface SupplyRow {
  asset: string;
  chain: string;
  week: string;
  supplyUsd: number;
}
const SUPPLY = supply.rows as SupplyRow[];

export interface ChainShare {
  chain: string;
  supplyUsd: number;
  share: number;
}

/** Circulating supply by chain for one stablecoin in its latest week, largest first, small chains folded into "Other". */
export function chainShares(asset: 'USDC' | 'USDT' | 'PYUSD', top = 5): { week: string; total: number; chains: ChainShare[] } {
  const rows = SUPPLY.filter((r) => r.asset === asset);
  const week = rows.reduce((m, r) => (r.week > m ? r.week : m), '');
  const latest = rows.filter((r) => r.week === week).sort((a, b) => b.supplyUsd - a.supplyUsd);
  const total = latest.reduce((a, r) => a + r.supplyUsd, 0);
  const head = latest.slice(0, top).map((r) => ({ chain: r.chain, supplyUsd: r.supplyUsd, share: r.supplyUsd / total }));
  const rest = latest.slice(top).reduce((a, r) => a + r.supplyUsd, 0);
  return { week, total, chains: rest > 0 ? [...head, { chain: 'Other', supplyUsd: rest, share: rest / total }] : head };
}

/** Change in circulating supply on one chain between two Mondays (nearest on or after each date). */
export function supplyChange(asset: 'USDC' | 'USDT' | 'PYUSD', chain: string, fromWeek: string, toWeek: string): number | null {
  const at = (w: string) => SUPPLY.find((r) => r.asset === asset && r.chain === chain && r.week === w)?.supplyUsd ?? null;
  const a = at(fromWeek);
  const b = at(toWeek);
  return a !== null && b !== null ? b - a : null;
}

export function supplyTotalAt(asset: 'USDC' | 'USDT' | 'PYUSD', week: string): number {
  return SUPPLY.filter((r) => r.asset === asset && r.week === week).reduce((a, r) => a + r.supplyUsd, 0);
}

export const fedFundsSeries = (): Array<{ date: string; value: number }> => rates.upper as Array<{ date: string; value: number }>;

// --- News events ---

export interface NewsEvent {
  date: string;
  label: string;
  assets: AssetId[];
}

/** Dated events that plausibly moved flows. Dates are public record; the on-chain PYUSD event is in the logs. */
export const NEWS_EVENTS: NewsEvent[] = [
  { date: '2023-03-11', label: 'USDC depegs after Circle discloses $3.3B at Silicon Valley Bank', assets: ['USDC', 'USDT'] },
  { date: '2025-07-18', label: 'GENIUS Act, the first US stablecoin law, signed', assets: ['USDC', 'USDT', 'PYUSD'] },
];

export interface EventWindow {
  asset: AssetId;
  /** Mean weekly net issuance (USD) in the 4 weeks before the event week, and in the 4 weeks from it */
  before: number | null;
  after: number | null;
}

/** Mean weekly net issuance in the 4 weeks before the event's week against the 4 weeks starting with it. */
export function eventWindow(asset: AssetId, date: string, weeks = 4): EventWindow {
  const s = netSeries(asset);
  const i = s.findIndex((w) => w.week === mondayOf(date));
  if (i < weeks || i + weeks > s.length) return { asset, before: null, after: null };
  const m = (xs: Array<{ net: number }>) => xs.reduce((a, w) => a + w.net, 0) / xs.length;
  return { asset, before: m(s.slice(i - weeks, i)), after: m(s.slice(i, i + weeks)) };
}

// --- Figures shared by the page, the summary and the API ---

/** Mean weekly net issuance in standard deviations for one asset and episode (during the episode). */
export const zDuring = (results: EpisodeResult[], asset: AssetId, episodeIndex: number): number | null => {
  const first = episodes()[episodeIndex]?.firstCut;
  return results.find((r) => r.asset === asset && r.episode.firstCut === first)?.duringZ ?? null;
};

export function issuanceSummary() {
  const t = totals();
  const gross = t.reduce((a, x) => a + x.gross, 0);
  const usdc = t.find((x) => x.asset.id === 'USDC')!;
  return {
    asOf: SNAPSHOT.flowsAsOf,
    startWeek: SNAPSHOT.flowsStartWeek,
    lastWeek: LAST_COMPLETE_WEEK,
    grossUsd: gross,
    usdcShareOfGross: usdc.gross / gross,
    cctpBridgedUsd: usdc.bridged,
    totals: t.map((x) => ({ asset: x.asset.id, issuer: x.asset.issuer, mintUsd: x.mint, redeemUsd: x.redeem, netUsd: x.net, firstWeek: x.firstWeek })),
    episodes: episodes(),
    episodeResults: episodeResults(),
  };
}

export const LAST_WEEK = LAST_COMPLETE_WEEK;
export const CUT_DATES = CUTS.map((c) => c.date);
