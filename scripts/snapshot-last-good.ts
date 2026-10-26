/**
 * Refresh src/data/last-good.json from the live sources. Run by hand when the data is fresh:
 *   npx tsx scripts/snapshot-last-good.ts
 *
 * It calls the same getters the pages use and keeps a part only if every row came back live.
 * A part that did not is left as it was, and the script exits 1. USTB and TBILL rows have no free
 * live source, so they carry over from the file with their original dates.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getBenchmark, withOnchainOndo } from '../src/lib/benchmark';
import { getChainTVL } from '../src/lib/chainSupply';
import { getTopHolders } from '../src/lib/topHolders';
import { getWeeklyFlows } from '../src/lib/weeklyFlows';
import type { LastGood } from '../src/lib/lastGood';

const FILE = join(__dirname, '..', 'src', 'data', 'last-good.json');
const prev = JSON.parse(readFileSync(FILE, 'utf8')) as LastGood;
const next: LastGood = { ...prev, generatedAt: new Date().toISOString() };
const failed: string[] = [];

async function main() {
  const [chain, holders, flows, bench] = await Promise.all([getChainTVL(), getTopHolders(), getWeeklyFlows(), getBenchmark()]);
  const allLive = (rows: { dataSource: string }[]) => rows.length > 0 && rows.every((r) => r.dataSource === 'live');

  if (allLive(chain)) next.chainTvl = chain;
  else failed.push('chainTvl');
  if (allLive(holders.rows)) next.topHolders = holders.rows;
  else failed.push('topHolders');
  if (flows.dataSource === 'live' && allLive(flows.rows)) next.weeklyFlows = flows.rows;
  else failed.push('weeklyFlows');

  const benchRows = allLive(chain) ? withOnchainOndo(bench.rows, chain) : bench.rows;
  const live = (p: string) => benchRows.find((r) => r.protocol === p)?.dataSource === 'live';
  if (live('nexus') && live('blackrock-buidl')) {
    next.competitorBenchmark = benchRows.map((r) => (r.dataSource === 'live' ? r : prev.competitorBenchmark.find((p) => p.protocol === r.protocol) ?? r));
  } else failed.push('competitorBenchmark');

  writeFileSync(FILE, JSON.stringify(next, null, 1) + '\n');
  console.log(`last-good.json written ${next.generatedAt}; chain ${next.chainTvl.length}, holders ${next.topHolders.length}, flows ${next.weeklyFlows.length}, benchmark ${next.competitorBenchmark.length}`);
  if (failed.length) {
    console.error(`not refreshed (source not fully live): ${failed.join(', ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
