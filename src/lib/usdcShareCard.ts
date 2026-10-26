/**
 * The USDC share-of-volume card: one 1024px SVG for posting. Every number comes from src/lib/issuance.ts
 * (the same snapshot as /issuance and /summary), so regenerating the card after a backfill refreshes it.
 * Dollars are always $B with one decimal, shares always % with one decimal, dates "Mon D, YYYY".
 * Colors are navy and red on white; the smallest text is MIN_FONT_PX at the 1024px canvas width.
 * Built by scripts/usdc-share-card.ts (npm run card:usdc-share).
 */

import { LAST_WEEK, SNAPSHOT, totals } from './issuance';

export const CARD_WIDTH = 1024;
export const MIN_FONT_PX = 26;
export const NAVY = '#0b2545';
export const RED = '#c8102e';
const BG = '#ffffff';
const FONT = "'Liberation Sans', Helvetica, Arial, sans-serif";

export interface CardRow {
  asset: string;
  gross: number;
  share: number;
}

export interface CardData {
  rows: CardRow[];
  total: number;
  usdcMint: number;
  usdcRedeem: number;
  /** Snapshot read time, ISO */
  asOf: string;
  lastWeek: string;
}

export function cardData(): CardData {
  const t = totals();
  const total = t.reduce((a, x) => a + x.gross, 0);
  const rows = t.map((x) => ({ asset: x.asset.id, gross: x.gross, share: x.gross / total })).sort((a, b) => b.gross - a.gross);
  const usdc = t.find((x) => x.asset.id === 'USDC')!;
  return { rows, total, usdcMint: usdc.mint, usdcRedeem: usdc.redeem, asOf: SNAPSHOT.flowsAsOf, lastWeek: LAST_WEEK };
}

export const fmtUsdB = (usd: number): string => `$${(usd / 1e9).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
export const fmtPct = (share: number): string => `${(share * 100).toFixed(1)}%`;
export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function cardSvg(d: CardData): string {
  const X = 56;
  const W = CARD_WIDTH - 2 * X;
  const usdc = d.rows.find((r) => r.asset === 'USDC')!;
  const text = (x: number, y: number, size: number, s: string, o: { weight?: number; fill?: string; anchor?: 'start' | 'end' | 'middle' } = {}) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? NAVY}" text-anchor="${o.anchor ?? 'start'}">${esc(s)}</text>`;

  const out: string[] = [];
  out.push(text(X, 104, 48, `USDC is ${fmtPct(usdc.share)} of the ${fmtUsdB(d.total)}`, { weight: 700 }));
  out.push(text(X, 160, 48, 'minted and redeemed on Ethereum', { weight: 700 }));
  out.push(text(X, 214, 28, `Six assets, Jan 2023 to the week of ${fmtDate(d.lastWeek)}`));

  // Share bar: USDC navy, the other five red.
  const barY = 258;
  const usdcW = Math.round(W * usdc.share);
  out.push(`<rect x="${X}" y="${barY}" width="${usdcW}" height="72" fill="${NAVY}"/>`);
  out.push(`<rect x="${X + usdcW}" y="${barY}" width="${W - usdcW}" height="72" fill="${RED}"/>`);
  out.push(text(X + 20, barY + 49, 36, `USDC ${fmtPct(usdc.share)}`, { weight: 700, fill: BG }));
  out.push(text(X + W, barY + 118, 28, `Other five assets ${fmtPct(1 - usdc.share)}`, { anchor: 'end', weight: 700, fill: RED }));

  // Table: one row per asset, mini bar scaled to share.
  const colAsset = X;
  const colBar = X + 150;
  const barMax = 300;
  const colUsd = X + W - 150;
  const colPct = X + W;
  let y = 440;
  out.push(text(colAsset, y, 26, 'Asset', { weight: 700 }));
  out.push(text(colUsd, y, 26, 'Mints + redemptions', { anchor: 'end', weight: 700 }));
  out.push(text(colPct, y, 26, 'Share', { anchor: 'end', weight: 700 }));
  out.push(`<rect x="${X}" y="${y + 14}" width="${W}" height="2" fill="${NAVY}"/>`);
  y += 62;
  for (const r of d.rows) {
    const color = r.asset === 'USDC' ? NAVY : RED;
    out.push(text(colAsset, y, 30, r.asset, { weight: 700, fill: color }));
    out.push(`<rect x="${colBar}" y="${y - 24}" width="${Math.max(2, Math.round(barMax * r.share))}" height="28" fill="${color}"/>`);
    out.push(text(colUsd, y, 30, fmtUsdB(r.gross), { anchor: 'end', fill: color }));
    out.push(text(colPct, y, 30, fmtPct(r.share), { anchor: 'end', weight: 700, fill: color }));
    y += 56;
  }
  out.push(`<rect x="${X}" y="${y - 30}" width="${W}" height="2" fill="${NAVY}"/>`);
  y += 18;
  out.push(text(colAsset, y, 30, 'Total', { weight: 700 }));
  out.push(text(colUsd, y, 30, fmtUsdB(d.total), { anchor: 'end', weight: 700 }));
  out.push(text(colPct, y, 30, fmtPct(1), { anchor: 'end', weight: 700 }));

  y += 64;
  out.push(text(X, y, 28, `USDC: ${fmtUsdB(d.usdcMint)} minted, ${fmtUsdB(d.usdcRedeem)} redeemed.`));
  out.push(text(X, y + 40, 28, 'Mostly market-maker churn. Ethereum logs only.'));

  y += 130;
  out.push(`<rect x="${X}" y="${y - 38}" width="${W}" height="2" fill="${RED}"/>`);
  out.push(text(X, y + 12, 28, `Data as of ${fmtDate(d.asOf)}`, { weight: 700, fill: RED }));
  out.push(text(X + W, y + 12, 28, 'github.com/RahilBhavan/Ondo', { anchor: 'end' }));

  const height = y + 56;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" font-family="${FONT}">`,
    `<title>USDC share of mint and redemption volume on Ethereum, data as of ${fmtDate(d.asOf)}</title>`,
    `<rect width="${CARD_WIDTH}" height="${height}" fill="${BG}"/>`,
    ...out,
    '</svg>',
    '',
  ].join('\n');
}
