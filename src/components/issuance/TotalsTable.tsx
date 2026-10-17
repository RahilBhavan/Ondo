import type { Totals } from '@/lib/issuance';
import { formatUsdCompact } from '@/lib/format';
import { formatWeek } from '@/lib/flowStats';

const num = 'text-right font-mono tabular-nums';

/** Table 1: lifetime mints, redemptions and net issuance per asset (≤ 20 numbers, so a table, not bars). */
export function TotalsTable({ rows, compact }: { rows: Totals[]; compact?: boolean }) {
  const sum = (f: (t: Totals) => number) => rows.reduce((a, t) => a + f(t), 0);
  const cell = compact ? 'py-1' : 'py-2.5';
  return (
    <table className={`w-full border-collapse ${compact ? 'text-[10px]' : 'text-sm'}`}>
      <thead>
        <tr className={`border-b border-[color:var(--ink)] text-left text-[color:var(--mute)] ${compact ? 'text-[9px]' : 'text-xs'}`}>
          <th className="py-1.5 pr-3 font-medium">{compact ? '' : 'Issuer'}</th>
          <th className="py-1.5 pr-3 font-medium">Asset</th>
          <th className={`py-1.5 pl-3 font-medium ${num}`}>Mints</th>
          <th className={`py-1.5 pl-3 font-medium ${num}`}>Redemptions</th>
          <th className={`py-1.5 pl-3 font-medium ${num}`}>Net</th>
          {!compact && <th className="py-1.5 pl-4 text-right text-xs font-medium">From</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.asset.id} className="border-b border-[color:var(--hairline)]">
            <td className={`${cell} pr-3 text-[color:var(--body)]`}>{t.asset.issuer}</td>
            <td className={`${cell} pr-3 font-medium text-[color:var(--ink)]`}>{t.asset.id}</td>
            <td className={`${cell} pl-3 ${num}`}>{formatUsdCompact(t.mint)}</td>
            <td className={`${cell} pl-3 ${num}`}>{formatUsdCompact(t.redeem)}</td>
            <td className={`${cell} pl-3 ${num} text-[color:var(--ink)]`}>{formatUsdCompact(t.net)}</td>
            {!compact && <td className={`${cell} pl-4 text-right text-xs text-[color:var(--mute)]`}>{formatWeek(t.firstWeek)}</td>}
          </tr>
        ))}
        <tr className="border-t border-[color:var(--ink)]">
          <td className={`${cell} pr-3 font-medium text-[color:var(--ink)]`} colSpan={2}>
            Five issuers
          </td>
          <td className={`${cell} pl-3 ${num} font-medium text-[color:var(--ink)]`}>{formatUsdCompact(sum((t) => t.mint))}</td>
          <td className={`${cell} pl-3 ${num} font-medium text-[color:var(--ink)]`}>{formatUsdCompact(sum((t) => t.redeem))}</td>
          <td className={`${cell} pl-3 ${num} font-medium text-[color:var(--ink)]`}>{formatUsdCompact(sum((t) => t.net))}</td>
          {!compact && <td />}
        </tr>
      </tbody>
    </table>
  );
}
