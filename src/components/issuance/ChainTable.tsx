import { chainShares } from '@/lib/issuance';
import { formatUsdCompact, formatPercent } from '@/lib/format';
import { formatWeek } from '@/lib/flowStats';

const ASSETS = ['USDC', 'USDT', 'PYUSD'] as const;

/** Where each stablecoin's supply sits: top chains by circulating supply (DefiLlama), latest week. */
export function ChainTable({ compact }: { compact?: boolean }) {
  const data = ASSETS.map((a) => ({ id: a, ...chainShares(a, compact ? 3 : 4) }));
  return (
    <div className={`grid gap-6 ${compact ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
      {data.map((d) => (
        <div key={d.id}>
          <p className="flex items-baseline justify-between border-b border-[color:var(--ink)] pb-1.5 text-xs text-[color:var(--mute)]">
            <span className="text-sm font-medium text-[color:var(--ink)]">{d.id}</span>
            <span className="font-mono tabular-nums">{formatUsdCompact(d.total)}</span>
          </p>
          <ul className="text-sm">
            {d.chains.map((c) => (
              <li key={c.chain} className="flex items-baseline justify-between border-b border-[color:var(--hairline)] py-1">
                <span className="text-[color:var(--body)]">{c.chain}</span>
                <span className="flex items-baseline gap-3 font-mono text-[13px] tabular-nums">
                  <span className="text-[color:var(--mute)]">{formatUsdCompact(c.supplyUsd)}</span>
                  <span className="w-12 text-right text-[color:var(--ink)]">{formatPercent(c.share)}</span>
                </span>
              </li>
            ))}
          </ul>
          {!compact && <p className="pt-1.5 text-xs text-[color:var(--mute)]">Week of {formatWeek(d.week)}</p>}
        </div>
      ))}
    </div>
  );
}
