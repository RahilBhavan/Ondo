/**
 * Self-check for the Rahil Design share card's content. Run: npx tsx src/lib/rahilCard.check.ts
 * Pins the post's framing and the card to the snapshot: numbers from issuance.ts, the through-week date and
 * "mint + redeem, not supply" in the footer and the alt text, one highlighted value that the title names, and the
 * committed spec.json being the current snapshot's.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grossIssuerVolume, LAST_WEEK, totals } from './issuance';
import { rahilCardSpec } from './rahilCard';
import { fmtDate, fmtPct, fmtUsdB } from './usdcShareCard';

const spec = rahilCardSpec();
const through = fmtDate(LAST_WEEK);

// 1. The card's numbers are the issuance snapshot's.
assert.equal(spec.data.total, grossIssuerVolume());
assert.equal(spec.data.usdcGross, totals().find((t) => t.asset.id === 'USDC')!.gross);
assert.equal(spec.rows.length, 6);
assert.ok(Math.abs(spec.rows.reduce((a, r) => a + r.share, 0) - 1) < 1e-9);

// 2. Framing: the footer and the alt text carry the through-week date and the definition of flow.
for (const [name, text] of [['footer', spec.source], ['alt', spec.alt]] as const) {
  assert.ok(text.includes(through), `${name} states the through-week date ${through}`);
  assert.ok(/mint \+ redeem, not supply/.test(text), `${name} says "mint + redeem, not supply"`);
  assert.ok(/six (selected )?Ethereum assets/i.test(text), `${name} names six Ethereum assets`);
}
assert.ok(spec.alt.includes(fmtUsdB(spec.data.cctpRemoved)), 'alt states the CCTP amount removed');

// 3. One accent, and the title names it.
const hi = spec.rows.filter((r) => r.highlight);
assert.equal(hi.length, 1);
assert.equal(hi[0].label, 'USDC');
assert.ok(spec.title.includes(fmtPct(spec.data.usdcShare)) && spec.title.includes(hi[0].text));
assert.ok(spec.title.includes(fmtUsdB(spec.data.total)));

// 4. The committed spec is the current snapshot's (rerun npm run card:rahil after a backfill).
const committed = JSON.parse(readFileSync(new URL('../../docs/img/rahil-card/spec.json', import.meta.url), 'utf8'));
assert.deepEqual(committed, JSON.parse(JSON.stringify(spec)), 'docs/img/rahil-card/spec.json is stale: run npm run card:rahil');
console.log(`rahilCard: ${spec.title}; through the week of ${through}; data as of ${spec.data.asOf}`);
