/**
 * Weekly instant mint/redeem flows (Pillar 2) from InstantManager event logs on Ethereum.
 *
 * Same definition as queries/mint_redeem_volume.sql (Dune query 8822192), computed here
 * from Blockscout's v2 address logs API (no key, 180 calls a minute, 50 logs a page, newest
 * first). Not the Etherscan-style /api getLogs: keyless, that allows about 10 calls and then
 * blocks the IP for up to an hour (ADR-008).
 *   - OUSG InstantManager and USDY InstantManager: Subscription / Redemption,
 *     USD value = depositUSDValue / redemptionUSDValue (1e18)
 *   - Legacy OUSG InstantManager: InstantMint[Rebasing]OUSG / InstantRedemption[Rebasing]OUSG,
 *     USD value = USDC amount in/out (1e6, USDC at $1)
 * The rebasing events on the current contracts fire alongside Subscription / Redemption
 * and are skipped. Week = Monday 00:00 UTC of the block time.
 *
 * Pages at or below HISTORY_END_BLOCK start from a fixed cursor, so their URLs and contents
 * never change and they cache for a week; only the pages newer than it revalidate hourly.
 * Each call times out after 10s; any failure throws and the caller falls back to mock data.
 */

import { decodeEventLog, getAddress, parseAbi, toEventSelector, type Hex } from 'viem';
import { mondayOf } from './flowStats';
import type { FlowEvent, WeeklyFlow } from './types';

type Token = FlowEvent['token'];

const BLOCKSCOUT_V2 = 'https://eth.blockscout.com/api/v2';
const TIMEOUT_MS = 10_000;
/**
 * Last block of the long-cached history (mined 2026-09-17).
 * ponytail: fixed boundary, so the hourly pages grow by ~1 page per series every few weeks.
 * Bump it when they do; any past block works.
 */
export const HISTORY_END_BLOCK = 26_000_000;
const HISTORY_REVALIDATE_S = 7 * 24 * 3600;
const LATEST_REVALIDATE_S = 3600;

export const FLOW_ABI = parseAbi([
  'event Subscription(address indexed subscriber, bytes32 indexed subscriberId, uint256 rwaAmount, address depositToken, uint256 depositAmount, uint256 depositUSDValue, uint256 fee)',
  'event Redemption(address indexed redeemer, bytes32 indexed redeemerId, uint256 rwaAmount, address receivingToken, uint256 receiveTokenAmount, uint256 redemptionUSDValue, uint256 fee)',
  'event InstantMintOUSG(address indexed sender, uint256 usdcAmountIn, uint256 ousgAmountOut)',
  'event InstantMintRebasingOUSG(address indexed sender, uint256 usdcAmountIn, uint256 ousgAmountOut, uint256 rousgAmountOut)',
  'event InstantRedemptionOUSG(address indexed sender, uint256 ousgAmountIn, uint256 usdcAmountOut)',
  'event InstantRedemptionRebasingOUSG(address indexed sender, uint256 rousgAmountIn, uint256 ousgAmountIn, uint256 usdcAmountOut)',
]);

type EventName = (typeof FLOW_ABI)[number]['name'];

/** Which side each event counts as, and which fields hold the wallet and the USD value. */
const RULES: Record<EventName, { kind: FlowEvent['kind']; wallet: string; usd: string; decimals: number }> = {
  Subscription: { kind: 'mint', wallet: 'subscriber', usd: 'depositUSDValue', decimals: 18 },
  Redemption: { kind: 'redeem', wallet: 'redeemer', usd: 'redemptionUSDValue', decimals: 18 },
  InstantMintOUSG: { kind: 'mint', wallet: 'sender', usd: 'usdcAmountIn', decimals: 6 },
  InstantMintRebasingOUSG: { kind: 'mint', wallet: 'sender', usd: 'usdcAmountIn', decimals: 6 },
  InstantRedemptionOUSG: { kind: 'redeem', wallet: 'sender', usd: 'usdcAmountOut', decimals: 6 },
  InstantRedemptionRebasingOUSG: { kind: 'redeem', wallet: 'sender', usd: 'usdcAmountOut', decimals: 6 },
};

export const topic0 = (name: EventName): Hex =>
  toEventSelector(FLOW_ABI.find((e) => e.name === name)!);

interface FlowContract {
  token: Token;
  address: `0x${string}`;
  events: EventName[];
  /** No events since Apr 2025: read the history range only. */
  retired?: boolean;
}

export const FLOW_CONTRACTS: FlowContract[] = [
  { token: 'OUSG', address: '0x93358db73B6cd4b98D89c8F5f230E81a95c2643a', events: ['Subscription', 'Redemption'] },
  {
    token: 'OUSG',
    address: '0x2826989983e3a66F0622132D019c2Ae173eb6A43',
    events: ['InstantMintOUSG', 'InstantMintRebasingOUSG', 'InstantRedemptionOUSG', 'InstantRedemptionRebasingOUSG'],
    retired: true,
  },
  { token: 'USDY', address: '0xa42613C243b67BF6194Ac327795b926B4b491f15', events: ['Subscription', 'Redemption'] },
];

/** Source link for live rows: the current OUSG InstantManager's events on Etherscan. */
export const FLOWS_SOURCE_URL = `https://etherscan.io/address/${FLOW_CONTRACTS[0].address}#events`;

/** One item of Blockscout's /api/v2/addresses/{address}/logs (fields used here). */
export interface BlockscoutLog {
  topics: (string | null)[];
  data: string;
  block_number: number;
  /** ISO 8601, UTC */
  block_timestamp: string;
  index: number;
  transaction_hash: string;
}

/** Decode one log into a FlowEvent. Throws on an unknown topic or malformed log. */
export function decodeFlowLog(log: BlockscoutLog, token: Token): FlowEvent {
  const topics = log.topics.filter((t): t is string => typeof t === 'string') as [Hex, ...Hex[]];
  const { eventName, args } = decodeEventLog({ abi: FLOW_ABI, topics, data: log.data as Hex, strict: true });
  const rule = RULES[eventName];
  const a = args as Record<string, unknown>;
  const raw = a[rule.usd];
  if (typeof raw !== 'bigint') throw new Error(`${eventName} has no ${rule.usd}`);
  if (Number.isNaN(Date.parse(log.block_timestamp))) {
    throw new Error(`bad block_timestamp ${log.block_timestamp} in ${log.transaction_hash}`);
  }
  return {
    token,
    kind: rule.kind,
    wallet: getAddress(a[rule.wallet] as string),
    // Same as the SQL: CAST(x AS DOUBLE) / 1e18 (or 1e6).
    usd: Number(raw) / 10 ** rule.decimals,
    week: mondayOf(log.block_timestamp),
  };
}

/** Group events by (week, token), as the SQL does. Pure: covered by weeklyFlows.check.ts. */
export function aggregateWeekly(events: FlowEvent[], meta: { asOf: string; source: string }): WeeklyFlow[] {
  const groups = new Map<string, { row: WeeklyFlow; minters: Set<string>; redeemers: Set<string> }>();
  for (const e of events) {
    const key = `${e.week}|${e.token}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        row: {
          week: e.week,
          token: e.token,
          mintVolumeUsd: 0,
          redeemVolumeUsd: 0,
          netFlowUsd: 0,
          mintCount: 0,
          redeemCount: 0,
          uniqueMinters: 0,
          uniqueRedeemers: 0,
          uniqueWallets: 0,
          dataSource: 'live',
          ...meta,
        },
        minters: new Set(),
        redeemers: new Set(),
      };
      groups.set(key, g);
    }
    if (e.kind === 'mint') {
      g.row.mintVolumeUsd += e.usd;
      g.row.mintCount += 1;
      g.minters.add(e.wallet);
    } else {
      g.row.redeemVolumeUsd += e.usd;
      g.row.redeemCount += 1;
      g.redeemers.add(e.wallet);
    }
  }
  return [...groups.values()]
    .map(({ row, minters, redeemers }) => ({
      ...row,
      netFlowUsd: row.mintVolumeUsd - row.redeemVolumeUsd,
      uniqueMinters: minters.size,
      uniqueRedeemers: redeemers.size,
      uniqueWallets: new Set([...minters, ...redeemers]).size,
    }))
    .sort((a, b) => a.week.localeCompare(b.week) || a.token.localeCompare(b.token));
}

interface LogsPage {
  items: BlockscoutLog[];
  next: { block_number: number; index: number } | null;
}

async function getPage(url: string, revalidate: number): Promise<LogsPage> {
  const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Blockscout logs: HTTP ${res.status} for ${url}`);
  const body = (await res.json()) as { items?: unknown; next_page_params?: LogsPage['next'] };
  if (!Array.isArray(body.items)) throw new Error(`Blockscout logs: no items for ${url}`);
  return { items: body.items as BlockscoutLog[], next: body.next_page_params ?? null };
}

/** Every log of one event on one contract. Pages run newest first; a cursor returns logs older than it. */
async function fetchSeries(address: string, topic: Hex, historyOnly: boolean): Promise<BlockscoutLog[]> {
  const base = `${BLOCKSCOUT_V2}/addresses/${address}/logs?topic=${topic}`;
  const at = (p: { block_number: number; index: number }) => `${base}&block_number=${p.block_number}&index=${p.index}`;
  const logs: BlockscoutLog[] = [];
  // Newer than HISTORY_END_BLOCK: from the head down, hourly.
  for (let url: string | null = historyOnly ? null : base; url; ) {
    const page = await getPage(url, LATEST_REVALIDATE_S);
    const fresh = page.items.filter((l) => l.block_number > HISTORY_END_BLOCK);
    logs.push(...fresh);
    url = fresh.length === page.items.length && page.next ? at(page.next) : null;
  }
  // History: a fixed starting cursor, so every page URL is stable.
  for (let url: string | null = at({ block_number: HISTORY_END_BLOCK + 1, index: 0 }); url; ) {
    const page = await getPage(url, HISTORY_REVALIDATE_S);
    logs.push(...page.items);
    url = page.next ? at(page.next) : null;
  }
  return logs;
}

/** Every counted event across the three contracts, full history. */
export async function fetchFlowEvents(): Promise<FlowEvent[]> {
  // One sequential chain per (contract, event), 8 in parallel: well under 180 calls a minute.
  const series = FLOW_CONTRACTS.flatMap((c) =>
    c.events.map(async (name) =>
      (await fetchSeries(c.address, topic0(name), c.retired ?? false)).map((l) => decodeFlowLog(l, c.token))
    )
  );
  return (await Promise.all(series)).flat();
}
