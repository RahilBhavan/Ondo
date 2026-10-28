/**
 * Content of the Rahil Design share card (square 1080px, authored at 360 CSS px at 3x): what the card says, from the
 * issuance snapshot. Every number comes from src/lib/issuance.ts (the same snapshot as /issuance and /summary).
 * Layout, fonts and colours are not here: scripts/rahil_card_render.py draws it with the rahil-design tokens.
 * Built by scripts/rahil-card.ts (npm run card:rahil).
 */
import { cardData, fmtDate, fmtPct, fmtUsdB } from './usdcShareCard';
import { totals } from './issuance';

export interface RahilCardRow {
  label: string;
  /** Share of the six-asset gross flow, 0..1 */
  share: number;
  text: string;
  highlight: boolean;
}

export interface RahilCardSpec {
  id: string;
  title: string;
  rows: RahilCardRow[];
  source: string;
  alt: string;
  /** The numbers behind the card, for the PR table and the post text */
  data: {
    asOf: string;
    lastWeek: string;
    usdcGross: number;
    total: number;
    usdcShare: number;
    cctpRemoved: number;
  };
}

/** Shares under 0.05% would print as 0.0%, which reads as zero. */
export const fmtShare = (share: number): string => (share < 0.0005 ? '<0.1%' : fmtPct(share));

export function rahilCardSpec(): RahilCardSpec {
  const d = cardData();
  const usdc = d.rows.find((r) => r.asset === 'USDC')!;
  const cctpRemoved = totals().reduce((a, t) => a + t.bridged, 0);
  const through = fmtDate(d.lastWeek);
  const read = fmtDate(d.asOf);
  const title = `USDC is ${fmtPct(usdc.share)} of ${fmtUsdB(d.total)} flow`;
  const rows = d.rows.map((r) => ({ label: r.asset, share: r.share, text: fmtShare(r.share), highlight: r.asset === 'USDC' }));
  const source = `Gross flow = mint + redeem, not supply. Six selected Ethereum assets, through the week of ${through}. Event logs.`;
  const alt =
    `${title}. Horizontal bars on a zero baseline, each asset's share of the six-asset total: ` +
    d.rows.map((r) => `${r.asset} ${fmtShare(r.share)} (${fmtUsdB(r.gross)})`).join(', ') +
    `. Total ${fmtUsdB(d.total)} of gross flow, mint + redeem, not supply, on six selected Ethereum assets, ` +
    `from January 2023 through the week of ${through}, with ${fmtUsdB(cctpRemoved)} of Circle CCTP transfers removed. ` +
    `Read from Ethereum event logs on ${read}.`;
  return {
    id: 'ondo-gross-flow-share',
    title,
    rows,
    source,
    alt,
    data: { asOf: d.asOf, lastWeek: d.lastWeek, usdcGross: usdc.gross, total: d.total, usdcShare: usdc.share, cctpRemoved },
  };
}
