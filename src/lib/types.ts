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

// --- Pillar 1: TVL by Issuer ---

export interface IssuerMetric extends Sourced {
  /** Institution name from address registry, or "Unknown Wallet" */
  name: string;
  /** Wallet address (checksummed) */
  address: string;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** Total value in USD */
  tvlUsd: number;
  /** Most recent transaction timestamp (ISO) */
  lastActivity: string;
}

// --- Pillar 2: Mint/Redemption Volume & Frequency ---

export interface VelocityDataPoint extends Sourced {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** Total mint volume in USD for this day */
  mintVolumeUsd: number;
  /** Total redeem volume in USD for this day */
  redeemVolumeUsd: number;
  /** Number of mint transactions */
  mintCount: number;
  /** Number of redeem transactions */
  redeemCount: number;
}

export interface MintRedeemEvent {
  type: 'mint' | 'redeem';
  /** Wallet address of subscriber/redeemer */
  address: string;
  /** Token: OUSG or USDY */
  token: 'OUSG' | 'USDY';
  /** RWA token amount */
  rwaAmount: number;
  /** Deposit/receiving token address (e.g., USDC) */
  paymentToken: string;
  /** USD value of the transaction */
  usdValue: number;
  /** Fee in native token units */
  fee: number;
  /** Block timestamp (ISO) */
  timestamp: string;
  /** Transaction hash */
  txHash: string;
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
  /** Token: OUSG or USDY (or both aggregated) */
  token: 'OUSG' | 'USDY' | 'ALL';
  tvlUsd: number;
  /** Number of unique holders */
  holderCount: number;
  /** Transaction count in last 30 days */
  txCount30d: number;
  /** Percentage of total TVL */
  pctOfTotal: number;
}

// --- Pillar 4: Competitive Benchmark ---

export type Protocol = 'nexus' | 'superstate' | 'openeden' | 'franklin-templeton';

export interface CompetitorMetric extends Sourced {
  protocol: Protocol;
  /** Display name */
  protocolName: string;
  /** Total value locked in USD */
  tvlUsd: number;
  /** 30-day trading volume in USD */
  volume30dUsd: number;
  /** Number of chains the product is available on */
  chainCount: number;
  /** Number of active issuers (Nexus-specific) */
  issuerCount: number;
  /** Redemption speed description */
  redemptionSpeed: string;
  /** Source date for this competitor's data (ISO) */
  sourceDate: string;
}

// --- Aggregated Dashboard Data ---

export interface DashboardMetrics {
  /** Total TVL across OUSG + USDY */
  totalTvlUsd: number;
  /** Number of identified institutional addresses */
  activeIssuers: number;
  /** 30-day total volume (mint + redeem) */
  volume30dUsd: number;
  /** Average transaction size in USD */
  avgTxSizeUsd: number;
  /** Data freshness */
  lastUpdated: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  issuerMetrics: IssuerMetric[];
  velocityData: VelocityDataPoint[];
  liquidityCells: LiquidityCell[];
  chainBreakdown: ChainTVL[];
  competitorBenchmark: CompetitorMetric[];
}

// --- Dune API Types ---

export interface DuneQueryResult<T = Record<string, unknown>> {
  execution_id: string;
  query_id: number;
  state: 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_FAILED';
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
