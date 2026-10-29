/** Self-check that README.md matches the committed snapshots. No network. Run: npx tsx src/lib/readmeSync.check.ts */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderReadme } from './readmeSync';

const readme = readFileSync(join(__dirname, '..', '..', 'README.md'), 'utf8');

// The README is what the snapshots render. On failure run `npm run sync:readme` and review the diff.
assert.equal(renderReadme(readme), readme, 'README.md is out of step with src/data/*.json: run `npm run sync:readme`');

// Rendering is idempotent, and a date marker takes its date from the snapshot, not from the text.
assert.equal(renderReadme(renderReadme(readme)), readme);
const stale = readme.replace(/(<!--asof:flows-->)[^<]*/, '$12000-01-01');
assert.notEqual(stale, readme);
assert.equal(renderReadme(stale), readme);

// Unknown markers and a README with none are errors, not silent no-ops.
assert.throws(() => renderReadme('<!--asof:nope-->x<!--/asof-->'), /unknown asof key/);
assert.throws(() => renderReadme('<!--snapshot:nope-->x<!--/snapshot-->'), /unknown snapshot block/);
assert.throws(() => renderReadme('no markers'), /no asof or snapshot markers/);

console.log('readmeSync check ok');
