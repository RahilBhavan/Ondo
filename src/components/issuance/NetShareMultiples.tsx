import type { AssetMeta, Episode } from '@/lib/issuance';
import { formatUsdCompact } from '@/lib/format';

export interface Panel {
  asset: AssetMeta;
  /** Cumulative net issuance in USD, from the asset's first week */
  points: Array<{ week: string; value: number }>;
}

interface Props {
  panels: Panel[];
  episodes: Episode[];
  cuts: string[];
  /** Extra weeks drawn after an episode's last cut (same as the comparison window) */
  tailWeeks: number;
  /** First and last week on the shared x axis */
  start: string;
  end: string;
  compact?: boolean;
}

const PAD = { l: 42, r: 54, t: 22, b: 18 };

const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Chart 1: cumulative net issuance per asset, same x axis, each panel on its own labeled dollar scale. Easing episodes shaded, cut dates ticked. */
export function NetShareMultiples({ panels, episodes, cuts, tailWeeks, start, end, compact }: Props) {
  const W = compact ? 290 : 360;
  const H = compact ? 104 : 118;
  const x0 = ms(start);
  const x1 = ms(end);
  const X = (iso: string) => PAD.l + ((ms(iso) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const years = [2023, 2024, 2025, 2026].filter((y) => ms(`${y}-01-01`) >= x0 && ms(`${y}-01-01`) <= x1);

  return (
    <div className={`grid gap-x-4 gap-y-1 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {panels.map(({ asset, points }) => {
        const defined = points;
        const hi = Math.max(0, ...points.map((p) => p.value));
        const lo = Math.min(0, ...points.map((p) => p.value));
        const span = hi - lo || 1;
        const Y = (v: number) => PAD.t + ((hi - v) / span) * (H - PAD.t - PAD.b);
        const path = defined.map((p, i) => `${i ? 'L' : 'M'}${X(p.week).toFixed(1)},${Y(p.value).toFixed(1)}`).join('');
        const last = defined[defined.length - 1];
        return (
          <figure key={asset.id} className="m-0">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full" aria-label={`${asset.id} cumulative net issuance`}>
              <text x={PAD.l} y={12} fontSize="12" fontWeight="600" fill="var(--ink)">
                {asset.id}
                <tspan fontWeight="400" fill="var(--mute)"> {asset.issuer}</tspan>
              </text>
              {episodes.map((e) => {
                const a = Math.max(X(e.firstCut), PAD.l);
                const b = Math.min(X(new Date(ms(e.lastCut) + tailWeeks * 7 * 86_400_000).toISOString().slice(0, 10)), W - PAD.r);
                return <rect key={e.firstCut} x={a} y={PAD.t} width={Math.max(b - a, 0)} height={H - PAD.t - PAD.b} fill="var(--link)" opacity={0.1} />;
              })}
              {[...new Set([lo, 0, hi])].map((v) => (
                <g key={v}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? 'var(--mute)' : 'var(--hairline)'} strokeWidth={v === 0 ? 0.75 : 0.5} />
                  {v === 0 && (Math.abs(Y(0) - Y(lo)) < 11 || Math.abs(Y(0) - Y(hi)) < 11) ? null : (
                  <text x={PAD.l - 4} y={Y(v) + 3} fontSize="9" textAnchor="end" fill="var(--mute)" fontFamily="var(--font-geist-mono), monospace">
                    {v === 0 ? '0' : formatUsdCompact(v)}
                  </text>
                  )}
                </g>
              ))}
              {cuts.map((c) => (
                <line key={c} x1={X(c)} x2={X(c)} y1={PAD.t} y2={H - PAD.b} stroke="var(--link)" strokeWidth={0.75} opacity={0.55} />
              ))}
              {years.map((y) => (
                <text key={y} x={X(`${y}-01-01`)} y={H - 5} fontSize="9" fill="var(--mute)" fontFamily="var(--font-geist-mono), monospace">
                  {y}
                </text>
              ))}
              {path && <path d={path} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
              {last && (
                <>
                  <circle cx={X(last.week)} cy={Y(last.value)} r={2.5} fill="var(--ink)" />
                  <text x={X(last.week) + 5} y={Y(last.value) + 3} fontSize="10" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-geist-mono), monospace">
                    {formatUsdCompact(last.value)}
                  </text>
                </>
              )}
              {!path && (
                <text x={(PAD.l + W - PAD.r) / 2} y={H / 2} fontSize="10" textAnchor="middle" fill="var(--mute)">
                  no data
                </text>
              )}
            </svg>
          </figure>
        );
      })}
    </div>
  );
}
