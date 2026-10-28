/**
 * Rahil Design share card for the gross-flow post: writes docs/img/rahil-card/spec.json from the issuance
 * snapshot, then draws the 1080x1080 PNG, the 360 and 390 feed checks and the palette audit.
 *
 *   npm run card:rahil           render from the snapshot (refuses a snapshot that is not from today)
 *   npm run card:rahil:fresh     re-pull the event logs first (about 25 to 40 minutes), then render
 *
 * Drawing needs uv, Firefox from Playwright's cache, and the rahil-design bundle (RAHIL_DESIGN_DIR, default
 * /home/rahil/.t3/projects/main/.agents/skills/rahil-design). --allow-stale renders an older snapshot anyway.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { rahilCardSpec } from '../src/lib/rahilCard';

const args = new Set(process.argv.slice(2));

if (args.has('--refresh')) {
  execFileSync('node', ['scripts/backfill-issuance.mjs'], { stdio: 'inherit' });
  // The feed just changed on disk; render in a fresh process so the new snapshot is what gets imported.
  execFileSync('npx', ['tsx', 'scripts/rahil-card.ts'], { stdio: 'inherit' });
  process.exit(0);
}

const spec = rahilCardSpec();
const today = new Date().toISOString().slice(0, 10);
if (spec.data.asOf.slice(0, 10) !== today && !args.has('--allow-stale')) {
  console.error(`Snapshot is from ${spec.data.asOf.slice(0, 10)}, not ${today}. Run: npm run card:rahil:fresh (or pass --allow-stale).`);
  process.exit(1);
}

const dir = new URL('../docs/img/rahil-card/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('spec.json', dir), JSON.stringify(spec, null, 2) + '\n');
console.log(`wrote spec (data as of ${spec.data.asOf}, through the week of ${spec.data.lastWeek})`);

execFileSync(
  'uv',
  ['run', '--with', 'playwright==1.63.0', '--with', 'fonttools', '--with', 'pillow', '--with', 'numpy', 'python', 'scripts/rahil_card_render.py', dir.pathname],
  { stdio: 'inherit' }
);
