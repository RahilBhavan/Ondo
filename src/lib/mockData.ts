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
  HolderMetric,
  VelocityDataPoint,
  WeeklyFlow,
  LiquidityCell,
  ChainTVL,
  CompetitorMetric,
  DashboardMetrics,
  DashboardData,
  Chain,
} from './types';
import { resolveAddress } from './addressRegistry';

const MOCK_SOURCE = 'Mock data derived from Ondo public disclosures (April 2026)';
const MOCK_AS_OF = '2026-04-09';

// --- Pillar 1: Top Ethereum holders ---

// Fallback snapshot when Dune or the price oracle is unavailable. Balances are the top 15
// holders per token from eth.blockscout.com/api/v2/tokens/<token>/holders on 2026-09-24,
// last activity from each holder's latest token transfer there, valued at the Ondo oracle
// price read the same day (OUSG $116.662365, USDY $1.14730001).
const HOLDERS_AS_OF = '2026-09-24';
const HOLDERS_SOURCE =
  'Blockscout top holders snapshot 2026-09-24, valued at OndoOracle.getAssetPrice (0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094)';
const HOLDERS_PRICE = { OUSG: 116.662365, USDY: 1.14730001 } as const;
const HOLDERS_SNAPSHOT: Array<['OUSG' | 'USDY', string, number, string]> = [
  ['OUSG', '0x1dD7950c266fB1be96180a8FDb0591F70200E018', 336339.56, '2026-07-01T18:41:47Z'],
  ['OUSG', '0x5D87Fa995c54ffF52cfE1C18d8EbF79f0eEb3AeB', 261208.83, '2026-04-17T17:23:35Z'],
  ['OUSG', '0x56e60979d5934a05D22606B0455d52F59F20A6A0', 187133.34, '2026-09-23T09:53:35Z'],
  ['OUSG', '0xbd9676EA1D6cAD553E87EC456869633C669ffB03', 75241.51, '2026-06-06T17:15:59Z'],
  ['OUSG', '0x5eD4EBAF21f83959f81b7e7545e25D313C84081f', 61295.76, '2026-04-14T02:49:23Z'],
  ['OUSG', '0x54752f87a3f8b6c594C9AFb110b2c491614de204', 38593.42, '2026-09-21T12:12:11Z'],
  ['OUSG', '0x4307b4C9D5A48AC7CB112eF6af7fbEFf5EFA6AF7', 33150.53, '2025-07-26T07:02:59Z'],
  ['OUSG', '0x0f365d86809A00761a8DF914c812dbFDF481C149', 23923.62, '2026-09-17T09:00:47Z'],
  ['OUSG', '0x3Ee60C57d70a6EC4877Dc24AA7d0e6FaC61cd11a', 17178.79, '2026-09-02T17:16:23Z'],
  ['OUSG', '0x233F8aBDcC60088634382ef12C78bdeBf69C9470', 9950.13, '2023-03-22T17:53:23Z'],
  ['OUSG', '0x609517eACD9Ec2E24DfFD4Eeca54C6fd88C866FE', 9147.24, '2026-09-03T13:56:35Z'],
  ['OUSG', '0x64beF4478942d8FD62bE281707076442aa2D055E', 8693.54, '2026-09-09T18:27:23Z'],
  ['OUSG', '0x02f8319261c904cB8C07E5DE7F19508354705669', 5605.26, '2024-10-17T13:40:35Z'],
  ['OUSG', '0x9Ff88e2c4844A47a70233BA676c3928b05d255Cf', 4922.02, '2026-08-06T07:26:59Z'],
  ['OUSG', '0xaDf5e32eB413e62DC072Aa5fd12F19a115aC3c12', 4062.49, '2026-09-18T16:39:47Z'],
  ['USDY', '0xA5b614026dCB1ef6e0E39AA53351b4F4bd225302', 359037168.47, '2026-05-18T20:34:47Z'],
  ['USDY', '0x661b5e00424B56Ba6e369e0c2f21E31B6FB8ee1a', 298780676.98, '2026-05-11T22:28:59Z'],
  ['USDY', '0x9C6Fa3b81cE92B7D82980D68CCCE9D6e48fe4AC2', 106360871.12, '2026-08-20T16:40:23Z'],
  ['USDY', '0xC392749B6ff2cd95e5a4e3Ed396c93f813395041', 83405034.64, '2026-09-22T17:26:23Z'],
  ['USDY', '0xC882b111A75C0c657fC507C04FbFcD2cC984F071', 47579905.14, '2026-09-24T04:28:11Z'],
  ['USDY', '0xEeB066aDa2D5C5eD9E4D9ee042bdEED430ae8512', 28843984.01, '2026-09-18T19:41:23Z'],
  ['USDY', '0xC9E397454f5478f4418e45181849C6eA66303D5A', 17230923.92, '2025-05-02T20:20:59Z'],
  ['USDY', '0x13134B8d770907eCb263cB88a67F9AF833007aFc', 16739969.14, '2026-09-15T11:11:23Z'],
  ['USDY', '0x6870289efC708e41A97AD5068A9F84b0DD2bfAED', 15867912.96, '2026-08-18T16:06:35Z'],
  ['USDY', '0xc0db94fDDE74f3902EA7995194d290F6BEE78f8C', 10280817.53, '2025-05-03T09:08:59Z'],
  ['USDY', '0xD56a32E078be332cDE149c29949a1D4d0C1c9F0E', 7500000.00, '2024-08-09T13:37:35Z'],
  ['USDY', '0x6d542B698541fFd216c45AcDC1C6C1CD233dFf94', 4403415.43, '2026-06-08T10:20:11Z'],
  ['USDY', '0xd97eCe4a24C4538d96E14296c5544c871caE2eEB', 3067064.04, '2026-07-31T13:16:35Z'],
  ['USDY', '0xEC33298A3aC7A5F5B3f21A3218a5D8E862Da8a12', 2683281.53, '2026-09-11T16:03:59Z'],
  ['USDY', '0xaf37c1167910ebC994e266949387d2c7C326b879', 2294280.89, '2026-09-23T10:57:35Z'],
];

const topHolders: HolderMetric[] = HOLDERS_SNAPSHOT.map(([token, address, balance, lastActivity]) => ({
  name: resolveAddress(address),
  address,
  token,
  balance,
  tvlUsd: balance * HOLDERS_PRICE[token],
  lastActivity,
  dataSource: 'mocked',
  asOf: HOLDERS_AS_OF,
  source: HOLDERS_SOURCE,
}));

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

const competitorBenchmark: CompetitorMetric[] = [
  {
    protocol: 'nexus',
    protocolName: 'Ondo Nexus (OUSG + USDY)',
    tvlUsd: 920_000_000,
    volume30dUsd: 145_000_000,
    chainCount: 11,
    issuerCount: 5,
    redemptionSpeed: 'Instant (atomic, same-block)',
    sourceDate: '2026-04-09',
    dataSource: 'estimated',
    asOf: MOCK_AS_OF,
    source: 'Aggregated from OUSG + USDY on-chain data via Dune',
  },
  {
    protocol: 'superstate',
    protocolName: 'Superstate (USTB)',
    tvlUsd: 320_000_000,
    volume30dUsd: 48_000_000,
    chainCount: 2,
    issuerCount: 1,
    redemptionSpeed: 'T+0 to T+1',
    sourceDate: '2026-04-01',
    dataSource: 'estimated',
    asOf: MOCK_AS_OF,
    source: 'Dune USTB Transfer events + Superstate public disclosures',
  },
  {
    protocol: 'openeden',
    protocolName: 'OpenEden (TBILL)',
    tvlUsd: 180_000_000,
    volume30dUsd: 22_000_000,
    chainCount: 3,
    issuerCount: 1,
    redemptionSpeed: 'T+0 (instant)',
    sourceDate: '2026-03-28',
    dataSource: 'estimated',
    asOf: MOCK_AS_OF,
    source: 'Dune TBILL Transfer events + OpenEden documentation',
  },
  {
    protocol: 'franklin-templeton',
    protocolName: 'Franklin Templeton (BENJI)',
    tvlUsd: 710_000_000,
    volume30dUsd: 35_000_000,
    chainCount: 3,
    issuerCount: 1,
    redemptionSpeed: 'T+1 (next business day)',
    sourceDate: '2026-03-15',
    dataSource: 'mocked',
    asOf: MOCK_AS_OF,
    source: 'Franklin Templeton press releases and SEC filings (March 2026)',
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
  topHolders,
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
    case 1: return MOCK_DATA.topHolders;
    case 2: return MOCK_DATA.velocityData;
    case 3: return { cells: MOCK_DATA.liquidityCells, breakdown: MOCK_DATA.chainBreakdown };
    case 4: return MOCK_DATA.competitorBenchmark;
  }
}
