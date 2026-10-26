'use client';

import type { HolderChain, HolderMetric } from '@/lib/types';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { formatUsdCompact, formatNumberCompact, formatDate } from '@/lib/format';

interface TopHoldersChartProps {
  data: HolderMetric[];
}

const GROUPS: { chain: HolderChain; token: HolderMetric['token']; label: string }[] = [
  { chain: 'ethereum', token: 'USDY', label: 'USDY on Ethereum' },
  { chain: 'ethereum', token: 'OUSG', label: 'OUSG on Ethereum' },
  { chain: 'stellar', token: 'USDY', label: 'USDY on Stellar' },
];

const accountUrl = (row: HolderMetric) =>
  row.chain === 'stellar'
    ? `https://stellar.expert/explorer/public/account/${row.address}`
    : `https://etherscan.io/address/${row.address}`;

export function TopHoldersChart({ data }: TopHoldersChartProps) {
  const asOf = data[0]?.asOf;

  return (
    <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] p-5 shadow-[var(--elevation)]">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-[-0.32px] text-[color:var(--ink)]">
          Top holders
        </h3>
        <p className="text-sm text-[color:var(--mute)] mt-1">
          Ethereum (OUSG and USDY) and Stellar (USDY). Names come from a manual address registry, then Blockscout public tags; unlabeled wallets show their address.
        </p>
      </div>

      <div className="max-h-[520px] overflow-auto space-y-6">
        {data.length === 0 && (
          <p className="text-sm text-[color:var(--body)]">
            Unavailable: the holder sources did not respond and no last good value is stored.
          </p>
        )}
        {GROUPS.map(({ chain, token, label }) => {
          const rows = data.filter((d) => d.token === token && d.chain === chain).sort((a, b) => b.balance - a.balance);
          if (!rows.length) return null;
          const total = rows.reduce((sum, d) => sum + d.tvlUsd, 0);
          return (
            <table key={label} className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--hairline)]">
                  <th className="text-left text-[color:var(--mute)] font-medium pb-2 pr-4">
                    {label} <span className="font-mono text-xs">({formatUsdCompact(total)} in top {rows.length})</span>
                  </th>
                  <th className="text-right text-[color:var(--mute)] font-medium pb-2 pr-4">Balance</th>
                  <th className="text-right text-[color:var(--mute)] font-medium pb-2 pr-4">Value</th>
                  <th className="text-center text-[color:var(--mute)] font-medium pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const prefix = row.dataSource === 'cached' ? '~' : '';
                  return (
                    <tr key={row.address} className="border-b border-[color:var(--hairline)] last:border-b-0">
                      <td className="py-2 pr-4">
                        <a
                          href={accountUrl(row)}
                          className="block max-w-[240px] truncate text-[color:var(--body)] hover:underline"
                          title={`${row.name} (${row.address})`}
                        >
                          {row.name}
                        </a>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-[13px] tabular-nums text-[color:var(--body)]" title={row.balance.toLocaleString('en-US')}>
                        {prefix}{formatNumberCompact(row.balance)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-[13px] tabular-nums text-[color:var(--ink)]">
                        {prefix}{formatUsdCompact(row.tvlUsd)}
                      </td>
                      <td className="py-2 text-center">
                        <DataSourceBadge source={row.dataSource} asOf={row.asOf} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })}
      </div>

      {asOf && (
        <p className="text-xs text-[color:var(--mute)] mt-3">
          Balances from Blockscout (Ethereum) and stellar.expert (Stellar) as of {formatDate(asOf)}, valued at the Ondo oracle price.
        </p>
      )}
    </div>
  );
}
