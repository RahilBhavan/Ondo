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

// --- Pillar 3: TVL per chain (supply snapshot) ---

// Fallback for src/lib/chainSupply.ts: per-chain supply read 2026-09-24 × OndoOracle prices that day.
const SUPPLY_AS_OF = '2026-09-24';
const SUPPLY_SOURCE = 'on-chain supply snapshot 2026-09-24';
const SNAPSHOT_PRICES = { OUSG: 116.662365, USDY: 1.14730001 };

const SUPPLY_SNAPSHOT: [ChainTVL['token'], Chain, number][] = [
  ['USDY', 'ethereum', 1_038_672_623.98],
  ['OUSG', 'ethereum', 1_090_030.63],
  ['USDY', 'mantle', 319_917.71],
  ['USDY', 'arbitrum', 2_728_685.9],
  ['OUSG', 'polygon', 0],
  ['USDY', 'solana', 157_215_505.1],
  ['OUSG', 'solana', 0],
  ['USDY', 'sui', 12_773_284.72],
  ['USDY', 'aptos', 1_848_234.81],
  ['USDY', 'noble', 5_612_589.04],
  ['USDY', 'stellar', 467_502_151.7],
  ['USDY', 'plume', 0],
  ['USDY', 'sei', 225_844_520.32],
  ['USDY', 'bnb', 68_682_990.33],
  ['OUSG', 'xrp-ledger', 1_639_899.44],
];

const snapshotTotal = SUPPLY_SNAPSHOT.reduce((s, [token, , supply]) => s + supply * SNAPSHOT_PRICES[token], 0);

const chainBreakdown: ChainTVL[] = SUPPLY_SNAPSHOT.map(([token, chain, supply]) => {
  const tvlUsd = supply * SNAPSHOT_PRICES[token];
  return {
    chain,
    token,
    supply,
    tvlUsd,
    pctOfTotal: (tvlUsd / snapshotTotal) * 100,
    dataSource: 'mocked',
    asOf: SUPPLY_AS_OF,
    source: SUPPLY_SOURCE,
  };
});

const liquidityCells: LiquidityCell[] = chainBreakdown.map((r) => ({
  issuer: r.token,
  chain: r.chain,
  tvlUsd: r.tvlUsd,
  dataSource: r.dataSource,
  asOf: r.asOf,
  source: r.source,
}));

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
  totalTvlUsd: snapshotTotal,
  lastUpdated: '2026-04-09T14:00:00Z',
};

// --- Export ---

export const MOCK_DATA: DashboardData = {
  metrics: dashboardMetrics,
  issuerMetrics,
  weeklyFlows: generateWeeklyFlows(),
  liquidityCells,
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
    case 2: return MOCK_DATA.weeklyFlows;
    case 3: return { cells: MOCK_DATA.liquidityCells, breakdown: MOCK_DATA.chainBreakdown };
    case 4: return MOCK_DATA.competitorBenchmark;
  }
}
