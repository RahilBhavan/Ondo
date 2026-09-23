'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklyFlow } from '@/lib/types';
import { formatUsdCompact } from '@/lib/format';
import { formatWeek, formatWeekShort, isCompleteWeek } from '@/lib/flowStats';

interface ChartRow extends WeeklyFlow {
  /** Redeem volume as a negative value, mirrored below the zero baseline */
  redeemNegUsd: number;
}

const TICK = {
  fill: 'var(--mute)',
  fontSize: 12,
  fontFamily: 'var(--font-geist-mono), monospace',
};

const LEGEND = [
  { label: 'Mint', swatch: 'h-2.5 w-2.5 rounded-[2px] bg-[var(--series-mint)]' },
  { label: 'Redeem', swatch: 'h-2.5 w-2.5 rounded-[2px] bg-[var(--series-redeem)]' },
  { label: 'Net flow', swatch: 'h-0.5 w-3.5 rounded-full bg-[var(--series-net)]' },
];

/** Vertical crosshair; handles both the band (x/width) and line (points) cursor shapes. */
function Crosshair(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
}) {
  const { x, y, width, height, points } = props;
  let cx: number | undefined;
  let top: number | undefined;
  let bottom: number | undefined;
  if (points && points.length >= 2) {
    cx = points[0].x;
    top = Math.min(points[0].y, points[1].y);
    bottom = Math.max(points[0].y, points[1].y);
  } else if (x !== undefined && width !== undefined && y !== undefined && height !== undefined) {
    cx = x + width / 2;
    top = y;
    bottom = y + height;
  }
  if (cx === undefined || top === undefined || bottom === undefined) return null;
  return <line x1={cx} x2={cx} y1={top} y2={bottom} stroke="var(--mute)" strokeWidth={1} strokeDasharray="3 3" />;
}

function FlowTooltip({
  active,
  payload,
  asOf,
  prefix,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  asOf: string;
  prefix: string;
}) {
  const row = payload?.[0]?.payload as ChartRow | undefined;
  if (!active || !row) return null;
  const lines: Array<[string, string]> = [
    ['Mint', `${prefix}${formatUsdCompact(row.mintVolumeUsd)}`],
    ['Redeem', `${prefix}${formatUsdCompact(row.redeemVolumeUsd)}`],
    ['Net', `${prefix}${formatUsdCompact(row.netFlowUsd)}`],
    ['Wallets', `${prefix}${row.uniqueWallets}`],
  ];
  return (
    <div className="min-w-[180px] rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-[13px] shadow-[var(--elevation)]">
      <p className="mb-1.5 font-medium text-[color:var(--ink)]">
        Week of {formatWeek(row.week)}
        {!isCompleteWeek(row.week, asOf) && <span className="font-normal text-[color:var(--mute)]"> (partial)</span>}
      </p>
      {lines.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6">
          <span className="text-[color:var(--body)]">{label}</span>
          <span className="font-mono tabular-nums text-[color:var(--ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

interface FlowChartsProps {
  token: WeeklyFlow['token'];
  data: WeeklyFlow[];
  asOf: string;
  /** '~' when the data is mocked, else '' */
  prefix: string;
}

export function FlowCharts({ token, data, asOf, prefix }: FlowChartsProps) {
  const rows = useMemo<ChartRow[]>(
    () => data.map((d) => ({ ...d, redeemNegUsd: -d.redeemVolumeUsd })),
    [data]
  );
  const syncId = `flows-${token}`;
  const tooltip = (
    <Tooltip
      cursor={<Crosshair />}
      content={(p) => <FlowTooltip active={p.active} payload={p.payload} asOf={asOf} prefix={prefix} />}
      isAnimationActive={false}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[color:var(--body)]">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span aria-hidden className={l.swatch} />
              {l.label}
            </li>
          ))}
        </ul>
        <div
          role="img"
          aria-label={`${token} weekly mint volume above zero, redeem volume below zero, net flow line`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={rows}
              syncId={syncId}
              stackOffset="sign"
              barCategoryGap="30%"
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeekShort}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v: number) => formatUsdCompact(v)}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <ReferenceLine y={0} stroke="var(--mute)" strokeWidth={1} />
              {tooltip}
              <Bar
                dataKey="mintVolumeUsd"
                name="Mint"
                stackId="flow"
                fill="var(--series-mint)"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                isAnimationActive={false}
              />
              <Bar
                dataKey="redeemNegUsd"
                name="Redeem"
                stackId="flow"
                fill="var(--series-redeem)"
                radius={[0, 0, 4, 4]}
                maxBarSize={14}
                isAnimationActive={false}
              />
              <Line
                dataKey="netFlowUsd"
                name="Net flow"
                type="linear"
                stroke="var(--series-net)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: 'var(--series-net)', stroke: 'var(--canvas)' }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-[color:var(--ink)]">Unique wallets</p>
        <div role="img" aria-label={`${token} unique wallets per week`}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={rows}
              syncId={syncId}
              barCategoryGap="30%"
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--hairline)" />
              <XAxis dataKey="week" hide />
              <YAxis
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={64}
                allowDecimals={false}
                tickCount={3}
              />
              {tooltip}
              <Bar
                dataKey="uniqueWallets"
                name="Unique wallets"
                fill="var(--series-wallets)"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
