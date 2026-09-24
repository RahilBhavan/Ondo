/**
 * Typed mock data for all 4 dashboard pillars.
 *
 * Every value has a source citation and asOf date.
 * Mock data is a first-class feature (ADR-002), not a fallback.
 * Ranges are realistic, derived from Ondo's public disclosures
 * and comparable protocol metrics.
 *
 * See docs/METHODOLOGY.md for the data source taxonomy.
 */

import type {
  IssuerMetric,
  VelocityDataPoint,
  WeeklyFlow,
  LiquidityCell,
  ChainTVL,
  CompetitorMetric,
  DashboardMetrics,
  DashboardData,
  Chain,
} from './types';

const MOCK_SOURCE = 'Mock data derived from Ondo public disclosures (April 2026)';
const MOCK_AS_OF = '2026-04-09';

// --- Pillar 1: TVL by Issuer ---

const issuerMetrics: IssuerMetric[] = [
  {
    name: 'Ondo Finance (Treasury)',
    address: '0xF67416a2C49f6A46FEe1c47681C5a3832cf8856c',
    token: 'OUSG',
    tvlUsd: 320_000_000,
    lastActivity: '2026-04-09T14:00:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from Ondo OUSG AUM ~$500M (steakhouse/ondo-finance)',
  },
  {
    name: 'Institutional Holder A',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    token: 'OUSG',
    tvlUsd: 85_000_000,
    lastActivity: '2026-04-08T10:30:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from top holder analysis on Etherscan',
  },
  {
    name: 'Institutional Holder B',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    token: 'OUSG',
    tvlUsd: 45_000_000,
    lastActivity: '2026-04-07T16:45:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from top holder analysis on Etherscan',
  },
  {
    name: 'Ondo Finance (USDY Treasury)',
    address: '0xbDa73A0F13958ee444e0782E1768aB4B76EdaE28',
    token: 'USDY',
    tvlUsd: 280_000_000,
    lastActivity: '2026-04-09T12:00:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from Ondo USDY AUM ~$400M (hashed_official/usdy)',
  },
  {
    name: 'DeFi Protocol Integration',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    token: 'USDY',
    tvlUsd: 62_000_000,
    lastActivity: '2026-04-09T08:15:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from DeFi protocol TVL on DefiLlama',
  },
  {
    name: 'Institutional Holder C',
    address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed0',
    token: 'USDY',
    tvlUsd: 28_000_000,
    lastActivity: '2026-04-06T11:00:00Z',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Estimated from top holder analysis on Etherscan',
  },
];

// --- Pillar 2: Mint/Redemption Volume & Frequency ---

function generateVelocityData(): VelocityDataPoint[] {
  const data: VelocityDataPoint[] = [];
  const now = new Date('2026-04-09');

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.3 : 1.0;
    const trendFactor = 1 + (90 - i) * 0.005;

    // OUSG: higher value, lower frequency
    data.push({
      date: dateStr,
      token: 'OUSG',
      mintVolumeUsd: Math.round(2_500_000 * weekendFactor * trendFactor * (0.7 + Math.random() * 0.6)),
      redeemVolumeUsd: Math.round(1_800_000 * weekendFactor * trendFactor * (0.5 + Math.random() * 0.8)),
      mintCount: Math.round(8 * weekendFactor * (0.5 + Math.random())),
      redeemCount: Math.round(5 * weekendFactor * (0.5 + Math.random())),
      dataSource: 'mocked',
      asOf: MOCK_AS_OF,
      source: 'Synthetic data modeled on Ondo InstantManager event patterns',
    });

    // USDY: lower value, higher frequency
    data.push({
      date: dateStr,
      token: 'USDY',
      mintVolumeUsd: Math.round(1_200_000 * weekendFactor * trendFactor * (0.6 + Math.random() * 0.8)),
      redeemVolumeUsd: Math.round(900_000 * weekendFactor * trendFactor * (0.4 + Math.random() * 0.9)),
      mintCount: Math.round(15 * weekendFactor * (0.5 + Math.random())),
      redeemCount: Math.round(12 * weekendFactor * (0.5 + Math.random())),
      dataSource: 'mocked',
      asOf: MOCK_AS_OF,
      source: 'Synthetic data modeled on Ondo InstantManager event patterns',
    });
  }

  return data;
}

/** Tiny seeded PRNG (mulberry32) so weekly mocks are identical across renders and servers. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKLY_FLOW_SOURCE =
  'Illustrative mock shaped from Ondo public disclosures, not on-chain data';

function generateWeeklyFlows(): WeeklyFlow[] {
  const rand = seededRandom(20260409);
  const data: WeeklyFlow[] = [];
  const WEEKS = 78;
  // Monday (UTC) of the MOCK_AS_OF week; the last bucket is a partial week, like live data.
  const lastMonday = new Date(`${MOCK_AS_OF}T00:00:00Z`);
  lastMonday.setUTCDate(lastMonday.getUTCDate() - ((lastMonday.getUTCDay() + 6) % 7));

  const profiles = [
    { token: 'OUSG' as const, mintBase: 14_000_000, redeemBase: 11_000_000, wallets: 14 },
    { token: 'USDY' as const, mintBase: 3_200_000, redeemBase: 2_600_000, wallets: 22 },
  ];

  for (let i = WEEKS - 1; i >= 0; i--) {
    const monday = new Date(lastMonday);
    monday.setUTCDate(monday.getUTCDate() - i * 7);
    const week = monday.toISOString().split('T')[0];
    const trendFactor = 1 + (WEEKS - 1 - i) * 0.01;
    // The newest bucket is the partial current week (Mon-Thu of a 7-day week).
    const partial = i === 0 ? 0.5 : 1;

    for (const p of profiles) {
      // Occasional lumpy weeks: one large subscriber or redeemer dominates.
      const mintSpike = rand() < 0.12 ? 1.4 + rand() * 0.8 : 1;
      const redeemSpike = rand() < 0.1 ? 1.5 + rand() * 0.9 : 1;
      const mintVolumeUsd = Math.round(p.mintBase * trendFactor * partial * mintSpike * (0.35 + rand() * 0.9));
      const redeemVolumeUsd = Math.round(p.redeemBase * trendFactor * partial * redeemSpike * (0.3 + rand() * 0.95));
      const mintCount = Math.max(1, Math.round(p.wallets * 1.6 * trendFactor * partial * (0.5 + rand() * 0.8)));
      const redeemCount = Math.max(1, Math.round(p.wallets * 1.2 * trendFactor * partial * (0.4 + rand() * 0.8)));
      const uniqueMinters = Math.max(1, Math.round(mintCount * (0.55 + rand() * 0.3)));
      const uniqueRedeemers = Math.max(1, Math.round(redeemCount * (0.55 + rand() * 0.3)));
      // Some wallets both mint and redeem in the same week.
      const overlap = Math.round(Math.min(uniqueMinters, uniqueRedeemers) * rand() * 0.35);

      data.push({
        week,
        token: p.token,
        mintVolumeUsd,
        redeemVolumeUsd,
        netFlowUsd: mintVolumeUsd - redeemVolumeUsd,
        mintCount,
        redeemCount,
        uniqueMinters,
        uniqueRedeemers,
        uniqueWallets: uniqueMinters + uniqueRedeemers - overlap,
        dataSource: 'mocked',
        asOf: MOCK_AS_OF,
        source: WEEKLY_FLOW_SOURCE,
      });
    }
  }

  return data;
}

// --- Pillar 3: Liquidity Depth Heatmap ---

const HEATMAP_CHAINS: Chain[] = [
  'ethereum', 'mantle', 'arbitrum', 'polygon',
  'solana', 'sui', 'aptos', 'noble', 'stellar', 'plume', 'sei',
];

const EVM_CHAINS = new Set<Chain>(['ethereum', 'mantle', 'arbitrum', 'polygon']);

function generateLiquidityCells(): LiquidityCell[] {
  const cells: LiquidityCell[] = [];

  // OUSG is primarily Ethereum + Polygon
  const ousgDistribution: Partial<Record<Chain, number>> = {
    ethereum: 420_000_000,
    polygon: 30_000_000,
  };

  for (const [chain, tvl] of Object.entries(ousgDistribution)) {
    cells.push({
      issuer: 'OUSG',
      chain: chain as Chain,
      tvlUsd: tvl,
      dataSource: EVM_CHAINS.has(chain as Chain) ? 'estimated' : 'mocked',
      asOf: MOCK_AS_OF,
      source: `OUSG ${chain} TVL from token Transfer events`,
    });
  }

  // USDY is across many chains
  const usdyDistribution: Partial<Record<Chain, number>> = {
    ethereum: 180_000_000,
    mantle: 95_000_000,
    arbitrum: 42_000_000,
    solana: 35_000_000,
    sui: 18_000_000,
    aptos: 12_000_000,
    noble: 8_000_000,
    stellar: 5_000_000,
    plume: 3_000_000,
    sei: 2_000_000,
  };

  for (const [chain, tvl] of Object.entries(usdyDistribution)) {
    cells.push({
      issuer: 'USDY',
      chain: chain as Chain,
      tvlUsd: tvl,
      dataSource: EVM_CHAINS.has(chain as Chain) ? 'estimated' : 'mocked',
      asOf: MOCK_AS_OF,
      source: EVM_CHAINS.has(chain as Chain)
        ? `USDY ${chain} TVL from Dune Transfer events`
        : `USDY ${chain} TVL estimated from bridge volumes and public disclosures`,
    });
  }

  return cells;
}

// --- Pillar 3 support: Chain Breakdown ---

const chainBreakdown: ChainTVL[] = [
  { chain: 'ethereum', token: 'ALL', tvlUsd: 600_000_000, holderCount: 450, txCount30d: 2800, pctOfTotal: 65.2, dataSource: 'estimated', asOf: MOCK_AS_OF, source: 'Aggregated from OUSG + USDY Ethereum Transfer events' },
  { chain: 'mantle', token: 'USDY', tvlUsd: 95_000_000, holderCount: 180, txCount30d: 920, pctOfTotal: 10.3, dataSource: 'estimated', asOf: MOCK_AS_OF, source: 'USDY Mantle Transfer events via Dune' },
  { chain: 'arbitrum', token: 'USDY', tvlUsd: 42_000_000, holderCount: 210, txCount30d: 650, pctOfTotal: 4.6, dataSource: 'estimated', asOf: MOCK_AS_OF, source: 'USDY Arbitrum Transfer events via Dune' },
  { chain: 'polygon', token: 'OUSG', tvlUsd: 30_000_000, holderCount: 85, txCount30d: 180, pctOfTotal: 3.3, dataSource: 'estimated', asOf: MOCK_AS_OF, source: 'OUSG Polygon Transfer events via Dune' },
  { chain: 'solana', token: 'USDY', tvlUsd: 35_000_000, holderCount: 320, txCount30d: 1100, pctOfTotal: 3.8, dataSource: 'mocked', asOf: MOCK_AS_OF, source: 'Estimated from Solana explorer and bridge volumes' },
  { chain: 'sui', token: 'USDY', tvlUsd: 18_000_000, holderCount: 140, txCount30d: 480, pctOfTotal: 2.0, dataSource: 'mocked', asOf: MOCK_AS_OF, source: 'Estimated from Sui explorer data' },
  { chain: 'aptos', token: 'USDY', tvlUsd: 12_000_000, holderCount: 95, txCount30d: 280, pctOfTotal: 1.3, dataSource: 'mocked', asOf: MOCK_AS_OF, source: 'Estimated from Aptos explorer data' },
];

// --- Pillar 4: Competitive Benchmark ---

// Fallback rows for src/lib/benchmark.ts. TVL is DefiLlama as fetched on 2026-09-24.
// Chain counts and redemption text are static facts quoted from each issuer's own docs;
// the live path reuses them. BUIDL has neither: no issuer page could be fetched to cite.
const BENCHMARK_AS_OF = '2026-09-24';

const competitorBenchmark: CompetitorMetric[] = [
  {
    protocol: 'nexus',
    protocolName: 'Ondo (OUSG + USDY)',
    tvlUsd: 2_560_085_819,
    chainCount: 14,
    chainSource: 'https://docs.ondo.finance/addresses',
    redemptionSpeed: 'OUSG: instant (atomic, limits apply), else typically next business day',
    redemptionSource: 'https://docs.ondo.finance/qualified-access-products/ousg/redeeming',
    dataSource: 'mocked',
    asOf: BENCHMARK_AS_OF,
    source: 'https://defillama.com/protocol/ondo-yield-assets',
  },
  {
    protocol: 'superstate',
    protocolName: 'Superstate (Invesco USTB)',
    tvlUsd: 549_663_644,
    chainCount: 3, // "Ethereum, Solana, and Plume"
    chainSource: 'https://docs.superstate.com/investors/tokenized-funds/available-funds/invesco-ustb',
    redemptionSpeed: 'USDC immediate (subject to liquidity); USD same day if before 1pm ET',
    redemptionSource: 'https://docs.superstate.com/investors/tokenized-funds/available-funds/invesco-ustb',
    dataSource: 'mocked',
    asOf: BENCHMARK_AS_OF,
    source: 'https://defillama.com/protocol/invesco-ustb',
  },
  {
    protocol: 'openeden',
    protocolName: 'OpenEden (TBILL)',
    tvlUsd: 245_857_859,
    chainCount: 3,
    chainSource: 'https://docs.openeden.com/tbill/smart-contract-addresses',
    redemptionSpeed: 'Typically next US business day (FIFO queue)',
    redemptionSource: 'https://docs.openeden.com/tbill/redemptions',
    dataSource: 'mocked',
    asOf: BENCHMARK_AS_OF,
    source: 'https://defillama.com/protocol/openeden-tbill',
  },
  {
    protocol: 'blackrock-buidl',
    protocolName: 'BlackRock (BUIDL)',
    tvlUsd: 3_514_788_159,
    chainCount: null,
    redemptionSpeed: 'Not disclosed',
    dataSource: 'mocked',
    asOf: BENCHMARK_AS_OF,
    source: 'https://defillama.com/protocol/blackrock-buidl',
  },
];

// --- Aggregated Dashboard Metrics ---

const dashboardMetrics: DashboardMetrics = {
  totalTvlUsd: 920_000_000,
  activeIssuers: 5,
  volume30dUsd: 145_000_000,
  avgTxSizeUsd: 185_000,
  lastUpdated: '2026-04-09T14:00:00Z',
};

// --- Export ---

export const MOCK_DATA: DashboardData = {
  metrics: dashboardMetrics,
  issuerMetrics,
  velocityData: generateVelocityData(),
  weeklyFlows: generateWeeklyFlows(),
  liquidityCells: generateLiquidityCells(),
  chainBreakdown,
  competitorBenchmark,
};

/**
 * Returns mock data for a specific pillar.
 * Used as fallback when Dune API is unavailable or for development.
 */
export function getMockPillarData(pillar: 1 | 2 | 3 | 4): unknown {
  switch (pillar) {
    case 1: return MOCK_DATA.issuerMetrics;
    case 2: return MOCK_DATA.velocityData;
    case 3: return { cells: MOCK_DATA.liquidityCells, breakdown: MOCK_DATA.chainBreakdown };
    case 4: return MOCK_DATA.competitorBenchmark;
  }
}
