/**
 * Regenerates the USDC share card from the issuance snapshot: docs/img/usdc-share-card.svg and, when
 * rsvg-convert is installed, a 1024px-wide PNG beside it.
 *
 *   npm run card:usdc-share           render from the snapshot (refuses a snapshot that is not from today)
 *   npm run card:usdc-share:fresh     re-pull the event logs first (about 25 to 40 minutes), then render
 *
 * --allow-stale renders an older snapshot anyway; the card still shows its as-of date.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cardData, cardSvg, CARD_WIDTH } from '../src/lib/usdcShareCard';

const args = new Set(process.argv.slice(2));

if (args.has('--refresh')) {
  execFileSync('node', ['scripts/backfill-issuance.mjs'], { stdio: 'inherit' });
  // The feed just changed on disk; render in a fresh process so the new snapshot is what gets imported.
  execFileSync('npx', ['tsx', 'scripts/usdc-share-card.ts'], { stdio: 'inherit' });
  process.exit(0);
}

const d = cardData();
const today = new Date().toISOString().slice(0, 10);
if (d.asOf.slice(0, 10) !== today && !args.has('--allow-stale')) {
  console.error(`Snapshot is from ${d.asOf.slice(0, 10)}, not ${today}. Run: npm run card:usdc-share:fresh (or pass --allow-stale).`);
  process.exit(1);
}

const dir = new URL('../docs/img/', import.meta.url);
mkdirSync(dir, { recursive: true });
const svgPath = new URL('usdc-share-card.svg', dir);
writeFileSync(svgPath, cardSvg(d));
console.log(`wrote ${svgPath.pathname} (data as of ${d.asOf}, through the week of ${d.lastWeek})`);

const pngPath = new URL('usdc-share-card.png', dir);
const png = spawnSync('rsvg-convert', ['-w', String(CARD_WIDTH), '-o', pngPath.pathname, svgPath.pathname], { stdio: 'inherit' });
if (png.error || png.status !== 0) console.warn('rsvg-convert not available or failed: SVG only. Convert it to PNG before posting.');
else console.log(`wrote ${pngPath.pathname}`);
