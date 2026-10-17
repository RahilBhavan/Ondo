import type { AssetMeta, Episode, EpisodeResult } from '@/lib/issuance';
import { formatUsdCompact } from '@/lib/format';

const money = (v: number | null) => (v === null ? 'n/a' : formatUsdCompact(v));

interface Props {
  assets: AssetMeta[];
  episodes: Episode[];
  results: EpisodeResult[];
  /** Shared x range [-limit, +limit] */
  limit: number;
  preWeeks: number;
  compact?: boolean;
}

const ROW = 15;
const GROUP_GAP = 9;
const L = 84; // label gutter
const R = 14;
const TOP = 34;

const sd = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}σ`;

/**
 * Chart 2: for each asset and easing episode, mean weekly net issuance before the first cut (open dot) and from the first
 * cut to 4 weeks after the last (solid dot), in standard deviations of that asset's own weekly net issuance. One x axis for
 * every row. Missing history is left blank, not zero.
 */
export function EpisodeDumbbell({ assets, episodes, results, limit, preWeeks, compact }: Props) {
  const W = compact ? 440 : 560;
  const X = (v: number) => L + ((v + limit) / (2 * limit)) * (W - L - R);
  const groupH = ROW * episodes.length + GROUP_GAP;
  const H = TOP + assets.length * groupH + 6;
  const ticks = [-limit, -limit / 2, 0, limit / 2, limit];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full" aria-label="Mean weekly net issuance before and during each Fed easing episode, by asset, in standard deviations">
      <g fontSize="9" fill="var(--mute)">
        <circle cx={L + 4} cy={7} r={3.2} fill="var(--canvas)" stroke="var(--ink)" strokeWidth={1.25} />
        <text x={L + 12} y={10}>{preWeeks} weeks before the first cut</text>
        <circle cx={L + (compact ? 150 : 164)} cy={7} r={3.2} fill="var(--link)" />
        <text x={L + (compact ? 158 : 172)} y={10}>during the easing episode</text>
      </g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={TOP - 8} y2={H - 4} stroke={t === 0 ? 'var(--mute)' : 'var(--hairline)'} strokeWidth={t === 0 ? 0.75 : 0.5} />
          <text x={X(t)} y={TOP - 12} fontSize="9" textAnchor="middle" fill="var(--mute)" fontFamily="var(--font-geist-mono), monospace">
            {sd(t)}
          </text>
        </g>
      ))}
      {assets.map((asset, ai) => {
        const top = TOP + ai * groupH;
        return (
          <g key={asset.id}>
            <text x={0} y={top + 10} fontSize="11" fontWeight="600" fill="var(--ink)">
              {asset.id}
            </text>
            {episodes.map((ep, i) => {
              const r = results.find((q) => q.asset === asset.id && q.episode.firstCut === ep.firstCut);
              const cy = top + 7 + i * ROW;
              const dash = ep.cuts > 1 ? `${ep.cuts} cuts` : '1 cut';
              return (
                <g key={ep.firstCut}>
                  <text x={L - 6} y={cy + 3} fontSize="8.5" textAnchor="end" fill="var(--mute)">
                    {ep.firstCut.slice(0, 4)}
                  </text>
                  {r && r.preZ !== null && r.duringZ !== null ? (
                    <>
                      <line x1={X(r.preZ)} x2={X(r.duringZ)} y1={cy} y2={cy} stroke="var(--mute)" strokeWidth={1.25} />
                      <circle cx={X(r.preZ)} cy={cy} r={3.2} fill="var(--canvas)" stroke="var(--ink)" strokeWidth={1.25}>
                        <title>{`${asset.id}, ${ep.label} (${dash}): ${sd(r.preZ)} in the ${preWeeks} weeks before (${money(r.preUsd)}/week)`}</title>
                      </circle>
                      <circle cx={X(r.duringZ)} cy={cy} r={3.2} fill="var(--link)">
                        <title>{`${asset.id}, ${ep.label} (${dash}): ${sd(r.duringZ)} during (${money(r.duringUsd)}/week)${r.percentile !== null ? `, higher than ${Math.round(r.percentile * 100)}% of same-length windows` : ''}`}</title>
                      </circle>
                      {!compact && (
                        <text x={X(r.duringZ) + (r.duringZ >= r.preZ ? 7 : -7)} y={cy + 3} fontSize="9" textAnchor={r.duringZ >= r.preZ ? 'start' : 'end'} fill="var(--ink)" fontFamily="var(--font-geist-mono), monospace">
                          {sd(r.duringZ)}
                        </text>
                      )}
                    </>
                  ) : (
                    <text x={X(0)} y={cy + 3} fontSize="8.5" textAnchor="middle" fill="var(--mute)">
                      {r?.duringZ !== null && r?.duringZ !== undefined ? 'no pre-period' : 'not issuing yet'}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
