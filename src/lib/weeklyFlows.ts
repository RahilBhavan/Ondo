/**
 * Weekly instant mint/redeem flows (Pillar 2) for OUSG and USDY.
 *
 * Live path: InstantManager event logs from Blockscout (keyless), aggregated by week
 * (src/lib/flowEvents.ts; definition in queries/mint_redeem_volume.sql). Any error
 * falls back to the last good series (src/data/last-good.json, labeled cached, dated by its
 * original read) and logs why. With no stored series the rows are empty and the page says so.
 */

import { aggregateWeekly, fetchFlowEvents, FLOWS_SOURCE_URL } from './flowEvents';
import { asCached, LAST_GOOD } from './lastGood';
import type { DataSource, WeeklyFlow } from './types';

export interface WeeklyFlowsResult {
  rows: WeeklyFlow[];
  dataSource: DataSource;
  /** Source page (contract event logs) when live, else null */
  queryUrl: string | null;
}

function lastGoodResult(reason: string): WeeklyFlowsResult {
  console.warn(`[weeklyFlows] using last good series: ${reason}`);
  return { rows: asCached(LAST_GOOD.weeklyFlows), dataSource: 'cached', queryUrl: null };
}

export async function getWeeklyFlows(): Promise<WeeklyFlowsResult> {
  try {
    const started = Date.now();
    const { events, calls } = await fetchFlowEvents();
    if (!events.length) return lastGoodResult('no InstantManager events returned');
    console.info(`[weeklyFlows] ${events.length} events, ${calls} page requests, ${Date.now() - started}ms`);
    const rows = aggregateWeekly(events, { asOf: new Date().toISOString(), source: FLOWS_SOURCE_URL });
    return { rows, dataSource: 'live', queryUrl: FLOWS_SOURCE_URL };
  } catch (err) {
    return lastGoodResult(`event logs failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
