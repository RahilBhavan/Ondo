import { ASSETS, CUT_DATES, LAST_WEEK, PRE_WEEKS, TAIL_WEEKS, cumulativeNet, episodeResults, episodes } from '@/lib/issuance';
import { EpisodeDumbbell } from './EpisodeDumbbell';
import { NetShareMultiples } from './NetShareMultiples';

/** The two figures, shared by /issuance and /summary. `compact` is the print size. */
export function Figure1({ compact }: { compact?: boolean }) {
  return (
    <NetShareMultiples
      panels={ASSETS.map((asset) => ({ asset, points: cumulativeNet(asset.id) }))}
      episodes={episodes()}
      cuts={CUT_DATES}
      tailWeeks={TAIL_WEEKS}
      start="2023-01-01"
      end={LAST_WEEK}
      compact={compact}
    />
  );
}

export function Figure2({ compact }: { compact?: boolean }) {
  return <EpisodeDumbbell assets={ASSETS} episodes={episodes()} results={episodeResults()} limit={1} preWeeks={PRE_WEEKS} compact={compact} />;
}
