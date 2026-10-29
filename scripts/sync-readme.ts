/**
 * Rewrite the README's snapshot dates and results from src/data/*.json (see src/lib/readmeSync.ts).
 * Run after a data refresh: npm run sync:readme
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderReadme } from '../src/lib/readmeSync';

const FILE = join(__dirname, '..', 'README.md');
const before = readFileSync(FILE, 'utf8');
const after = renderReadme(before);
if (after === before) console.log('README.md already matches the snapshots');
else {
  writeFileSync(FILE, after);
  console.log('README.md updated from the snapshots');
}
