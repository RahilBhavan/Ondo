/**
 * Core data types for the Ondo Nexus Adoption Intelligence Dashboard.
 * Derived from contract research (docs/CONTRACT_RESEARCH.md).
 * All live data, mock data, and API responses conform to these shapes.
 */

// --- Data Source Taxonomy ---

/**
 * live: read from its source on this render. cached: the last good value, a real read from an
 * earlier date kept in src/data/last-good.json (asOf says when). estimated: a total that mixes the two.
 * No label means invented data: the dashboard has no mocked values.
 */
export type DataSource = 'live' | 'estimated' | 'cached';

export interface Sourced {
  dataSource: DataSource;
  /** ISO date string of when this data was last updated */
  asOf: string;
  /** Human-readable source citation */
  source: string;
}

// --- Pillar 1: Top holders (Ethereum and Stellar) ---

export type HolderChain = 'ethereum' | 'stellar';

export interface HolderMetric extends Sourced {
  /** Chain the balance sits on */
  chain: HolderChain;
  /** Registry label, else Blockscout public name tag, else "Unknown wallet (0x…)" */
  name: string;
  /** Wallet address (checksummed on Ethereum, a G or C account on Stellar) */
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

/** One counted InstantManager event, before weekly aggregation. */
export interface FlowEvent {
  token: 'OUSG' | 'USDY';
  kind: 'mint' | 'redeem';
  /** Subscriber / redeemer / sender address (checksummed) */
  wallet: string;
  /** USD value of the mint or redeem */
  usd: number;
  /** ISO date (YYYY-MM-DD) of the week start, Monday 00:00 UTC of the block time */
  week: string;
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
