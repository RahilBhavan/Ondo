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
  WeeklyFlow,
  LiquidityCell,
  ChainTVL,
  CompetitorMetric,
  DashboardMetrics,
  DashboardData,
  Chain,
} from './types';
import { holderName } from './addressRegistry';

const MOCK_SOURCE = 'Mock data derived from Ondo public disclosures (April 2026)';
const MOCK_AS_OF = '2026-04-09';

// --- Pillar 1: Top Ethereum holders ---

// Fallback snapshot when Dune or the price oracle is unavailable. Balances are the top 15
// holders per token from eth.blockscout.com/api/v2/tokens/<token>/holders on 2026-09-24
// (with the one Blockscout public name tag among them), valued at the Ondo oracle price
// read the same day (OUSG $116.662365, USDY $1.14730001).
const HOLDERS_AS_OF = '2026-09-24';
const HOLDERS_SOURCE =
  'Blockscout top holders snapshot 2026-09-24, valued at OndoOracle.getAssetPrice (0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094)';
const HOLDERS_PRICE = { OUSG: 116.662365, USDY: 1.14730001 } as const;
const HOLDERS_SNAPSHOT: Array<['OUSG' | 'USDY', string, number, string?]> = [
  ['OUSG', '0x1dD7950c266fB1be96180a8FDb0591F70200E018', 336339.56],
  ['OUSG', '0x5D87Fa995c54ffF52cfE1C18d8EbF79f0eEb3AeB', 261208.83],
  ['OUSG', '0x56e60979d5934a05D22606B0455d52F59F20A6A0', 187133.34],
  ['OUSG', '0xbd9676EA1D6cAD553E87EC456869633C669ffB03', 75241.51],
  ['OUSG', '0x5eD4EBAF21f83959f81b7e7545e25D313C84081f', 61295.76],
  ['OUSG', '0x54752f87a3f8b6c594C9AFb110b2c491614de204', 38593.42],
  ['OUSG', '0x4307b4C9D5A48AC7CB112eF6af7fbEFf5EFA6AF7', 33150.53],
  ['OUSG', '0x0f365d86809A00761a8DF914c812dbFDF481C149', 23923.62],
  ['OUSG', '0x3Ee60C57d70a6EC4877Dc24AA7d0e6FaC61cd11a', 17178.79],
  ['OUSG', '0x233F8aBDcC60088634382ef12C78bdeBf69C9470', 9950.13],
  ['OUSG', '0x609517eACD9Ec2E24DfFD4Eeca54C6fd88C866FE', 9147.24],
  ['OUSG', '0x64beF4478942d8FD62bE281707076442aa2D055E', 8693.54],
  ['OUSG', '0x02f8319261c904cB8C07E5DE7F19508354705669', 5605.26],
  ['OUSG', '0x9Ff88e2c4844A47a70233BA676c3928b05d255Cf', 4922.02],
  ['OUSG', '0xaDf5e32eB413e62DC072Aa5fd12F19a115aC3c12', 4062.49],
  ['USDY', '0xA5b614026dCB1ef6e0E39AA53351b4F4bd225302', 359037168.47],
  ['USDY', '0x661b5e00424B56Ba6e369e0c2f21E31B6FB8ee1a', 298780676.98],
  ['USDY', '0x9C6Fa3b81cE92B7D82980D68CCCE9D6e48fe4AC2', 106360871.12],
  ['USDY', '0xC392749B6ff2cd95e5a4e3Ed396c93f813395041', 83405034.64],
  ['USDY', '0xC882b111A75C0c657fC507C04FbFcD2cC984F071', 47579905.14, 'Gate.io: Deposit Address'],
  ['USDY', '0xEeB066aDa2D5C5eD9E4D9ee042bdEED430ae8512', 28843984.01],
  ['USDY', '0xC9E397454f5478f4418e45181849C6eA66303D5A', 17230923.92],
  ['USDY', '0x13134B8d770907eCb263cB88a67F9AF833007aFc', 16739969.14],
  ['USDY', '0x6870289efC708e41A97AD5068A9F84b0DD2bfAED', 15867912.96],
  ['USDY', '0xc0db94fDDE74f3902EA7995194d290F6BEE78f8C', 10280817.53],
  ['USDY', '0xD56a32E078be332cDE149c29949a1D4d0C1c9F0E', 7500000.00],
  ['USDY', '0x6d542B698541fFd216c45AcDC1C6C1CD233dFf94', 4403415.43],
  ['USDY', '0xd97eCe4a24C4538d96E14296c5544c871caE2eEB', 3067064.04],
  ['USDY', '0xEC33298A3aC7A5F5B3f21A3218a5D8E862Da8a12', 2683281.53],
  ['USDY', '0xaf37c1167910ebC994e266949387d2c7C326b879', 2294280.89],
];

const topHolders: HolderMetric[] = HOLDERS_SNAPSHOT.map(([token, address, balance, tag]) => ({
  name: holderName(address, tag ?? null),
  address,
  token,
  balance,
  tvlUsd: balance * HOLDERS_PRICE[token],
  dataSource: 'mocked',
  asOf: HOLDERS_AS_OF,
  source: HOLDERS_SOURCE,
}));

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
  topHolders,
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
    case 1: return MOCK_DATA.topHolders;
    case 2: return MOCK_DATA.weeklyFlows;
    case 3: return { cells: MOCK_DATA.liquidityCells, breakdown: MOCK_DATA.chainBreakdown };
    case 4: return MOCK_DATA.competitorBenchmark;
  }
}
