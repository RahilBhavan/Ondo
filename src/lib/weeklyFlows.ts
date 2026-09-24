/**
 * Weekly instant mint/redeem flows (Pillar 2) for OUSG and USDY.
 *
 * Live path: InstantManager event logs from Blockscout (keyless), aggregated by week
 * (src/lib/flowEvents.ts; definition in queries/mint_redeem_volume.sql). Any error
 * falls back to the labeled mock series and logs why.
 */

import { aggregateWeekly, fetchFlowEvents, FLOWS_SOURCE_URL } from './flowEvents';
import { MOCK_DATA } from './mockData';
import type { DataSource, WeeklyFlow } from './types';

export interface WeeklyFlowsResult {
  rows: WeeklyFlow[];
  dataSource: DataSource;
  /** Source page (contract event logs) when live, else null */
  queryUrl: string | null;
}

function mockResult(reason: string): WeeklyFlowsResult {
  console.warn(`[weeklyFlows] using mock data: ${reason}`);
  return { rows: MOCK_DATA.weeklyFlows, dataSource: 'mocked', queryUrl: null };
}

export async function getWeeklyFlows(): Promise<WeeklyFlowsResult> {
  try {
    const started = Date.now();
    const events = await fetchFlowEvents();
    if (!events.length) return mockResult('no InstantManager events returned');
    console.info(`[weeklyFlows] ${events.length} events in ${Date.now() - started}ms`);
    const rows = aggregateWeekly(events, { asOf: new Date().toISOString(), source: FLOWS_SOURCE_URL });
    return { rows, dataSource: 'live', queryUrl: FLOWS_SOURCE_URL };
  } catch (err) {
    return mockResult(`event logs failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
