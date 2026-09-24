/**
 * Core data types for the Ondo Nexus Adoption Intelligence Dashboard.
 * Derived from contract research (docs/CONTRACT_RESEARCH.md).
 * All Dune query results, mock data, and API responses conform to these shapes.
 */

// --- Data Source Taxonomy ---

export type DataSource = 'live' | 'estimated' | 'mocked';

export interface Sourced {
  dataSource: DataSource;
  /** ISO date string of when this data was last updated */
  asOf: string;
  /** Human-readable source citation */
  source: string;
}

// --- Pillar 1: Top Ethereum holders ---

export interface HolderMetric extends Sourced {
  /** Registry label, else Blockscout public name tag, else "Unknown wallet (0x…)" */
  name: string;
  /** Wallet address (checksummed) */
  address: string;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** Balance in token units */
  balance: number;
  /** balance × Ondo oracle price, in USD */
  tvlUsd: number;
}

// --- Pillar 2: Mint/Redemption Volume & Frequency ---

export interface WeeklyFlow extends Sourced {
  /** ISO date (YYYY-MM-DD) of the week start, Monday 00:00 UTC */
  week: string;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** Total mint (Subscription) volume in USD for this week */
  mintVolumeUsd: number;
  /** Total redeem (Redemption) volume in USD for this week */
  redeemVolumeUsd: number;
  /** Mint volume minus redeem volume in USD (can be negative) */
  netFlowUsd: number;
  /** Number of mint transactions */
  mintCount: number;
  /** Number of redeem transactions */
  redeemCount: number;
  /** Distinct subscriber addresses */
  uniqueMinters: number;
  /** Distinct redeemer addresses */
  uniqueRedeemers: number;
  /** Distinct addresses across both sides (not minters + redeemers) */
  uniqueWallets: number;
}

// --- Pillar 3: Liquidity Depth Heatmap ---

export type Chain =
  | 'ethereum'
  | 'mantle'
  | 'arbitrum'
  | 'polygon'
  | 'solana'
  | 'sui'
  | 'aptos'
  | 'noble'
  | 'stellar'
  | 'plume'
  | 'sei'
  | 'bnb'
  | 'xrp-ledger';

export interface LiquidityCell extends Sourced {
  /** Issuer/asset name */
  issuer: string;
  chain: Chain;
  /** TVL in USD for this cell */
  tvlUsd: number;
}

export interface ChainTVL extends Sourced {
  chain: Chain;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** Total supply on this chain, in token units */
  supply: number;
  tvlUsd: number;
  /** Percentage of total TVL (0-100) */
  pctOfTotal: number;
}

// --- Pillar 4: Competitive Benchmark ---

export type Protocol = 'nexus' | 'superstate' | 'openeden' | 'blackrock-buidl';

/** One benchmark row. `dataSource`, `asOf` and `source` describe the TVL. */
export interface CompetitorMetric extends Sourced {
  protocol: Protocol;
  /** Display name */
  protocolName: string;
  /** Total value locked in USD */
  tvlUsd: number;
  /** Number of chains the product is deployed on; null when no citable count */
  chainCount: number | null;
  /** Citation URL for chainCount */
  chainSource?: string;
  /** Redemption speed, quoted from the issuer's own docs, or "Not disclosed" */
  redemptionSpeed: string;
  /** Citation URL for redemptionSpeed */
  redemptionSource?: string;
}

// --- Dune API Types ---

export interface DuneQueryResult<T = Record<string, unknown>> {
  execution_id: string;
  query_id: number;
  state: 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_FAILED';
  execution_started_at?: string;
  execution_ended_at?: string;
  result?: {
    rows: T[];
    metadata: {
      column_names: string[];
      column_types: string[];
      total_row_count: number;
    };
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  queryId: number;
}
