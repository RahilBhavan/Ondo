/**
 * Pure helpers for the /flows page: week math, gap filling, growth.
 * No server-only imports, safe for client components.
 */

import type { WeeklyFlow } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const WEEK_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const WEEK_TICK = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function toUtcMs(isoDate: string): number {
  return Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`);
}

/** Monday (UTC) of the week containing the given ISO date or timestamp, as YYYY-MM-DD. */
export function mondayOf(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back))
    .toISOString()
    .slice(0, 10);
}

/** "Mar 30, 2026" in UTC, so server and browser agree. */
export function formatWeek(iso: string): string {
  return WEEK_LABEL.format(new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso));
}

/** "Mar 30" in UTC, for axis ticks. */
export function formatWeekShort(iso: string): string {
  return WEEK_TICK.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

/** True when the whole week (Mon 00:00 to next Mon 00:00 UTC) ended at or before asOf. */
export function isCompleteWeek(week: string, asOf: string): boolean {
  const asOfMs = Date.parse(asOf.length <= 10 ? `${asOf}T00:00:00Z` : asOf);
  return toUtcMs(week) + WEEK_MS <= asOfMs;
}

/**
 * One token's rows, ascending, with zero rows inserted for weeks that had no events
 * (the SQL only emits weeks with activity), from its first week through the asOf week.
 */
export function weeklySeries(rows: WeeklyFlow[], token: WeeklyFlow['token']): WeeklyFlow[] {
  const own = rows.filter((r) => r.token === token).sort((a, b) => a.week.localeCompare(b.week));
  if (own.length === 0) return [];
  const byWeek = new Map(own.map((r) => [r.week, r]));
  const template = own[own.length - 1];
  const last = Math.max(toUtcMs(template.week), toUtcMs(mondayOf(template.asOf)));
  const out: WeeklyFlow[] = [];
  for (let t = toUtcMs(own[0].week); t <= last; t += WEEK_MS) {
    const week = new Date(t).toISOString().slice(0, 10);
    out.push(
      byWeek.get(week) ?? {
        ...template,
        week,
        mintVolumeUsd: 0,
        redeemVolumeUsd: 0,
        netFlowUsd: 0,
        mintCount: 0,
        redeemCount: 0,
        uniqueMinters: 0,
        uniqueRedeemers: 0,
        uniqueWallets: 0,
      }
    );
  }
  return out;
}

/**
 * Total volume (mint + redeem) of the last 12 complete weeks vs the 12 before, as a fraction.
 * Null when there are fewer than 24 complete weeks or the prior window is zero.
 */
export function growth12w(series: WeeklyFlow[], asOf: string): number | null {
  const complete = series.filter((r) => isCompleteWeek(r.week, asOf));
  if (complete.length < 24) return null;
  const total = (xs: WeeklyFlow[]) => xs.reduce((s, r) => s + r.mintVolumeUsd + r.redeemVolumeUsd, 0);
  const recent = total(complete.slice(-12));
  const prior = total(complete.slice(-24, -12));
  return prior > 0 ? recent / prior - 1 : null;
}

export interface FourWeekStats {
  volumeUsd: number;
  netFlowUsd: number;
  txCount: number;
  /** volumeUsd / txCount, null when there were no transactions */
  avgTxSizeUsd: number | null;
  /** Total volume of the 4 complete weeks before the window */
  priorVolumeUsd: number;
  /** volumeUsd vs priorVolumeUsd as a fraction, null when the prior window is zero */
  volumeTrend: number | null;
}

/**
 * Last 4 complete weeks summed across OUSG and USDY (gap weeks filled per token),
 * plus the volume of the 4 complete weeks before that.
 */
export function fourWeekStats(rows: WeeklyFlow[]): FourWeekStats {
  const recent: WeeklyFlow[] = [];
  const prior: WeeklyFlow[] = [];
  for (const token of ['OUSG', 'USDY'] as const) {
    const series = weeklySeries(rows, token);
    // Both tokens' windows line up: every row from one fetch shares one asOf.
    const asOf = series[series.length - 1]?.asOf ?? '';
    const complete = series.filter((r) => isCompleteWeek(r.week, asOf));
    recent.push(...complete.slice(-4));
    prior.push(...complete.slice(-8, -4));
  }
  const volume = (xs: WeeklyFlow[]) => xs.reduce((s, r) => s + r.mintVolumeUsd + r.redeemVolumeUsd, 0);
  const volumeUsd = volume(recent);
  const priorVolumeUsd = volume(prior);
  const txCount = recent.reduce((s, r) => s + r.mintCount + r.redeemCount, 0);
  return {
    volumeUsd,
    netFlowUsd: recent.reduce((s, r) => s + r.netFlowUsd, 0),
    txCount,
    avgTxSizeUsd: txCount > 0 ? volumeUsd / txCount : null,
    priorVolumeUsd,
    volumeTrend: priorVolumeUsd > 0 ? volumeUsd / priorVolumeUsd - 1 : null,
  };
}
