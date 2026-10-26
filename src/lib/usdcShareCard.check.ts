/**
 * Self-check for the USDC share card. Run: npx tsx src/lib/usdcShareCard.check.ts
 * Pins the review's requirements: numbers from the snapshot, one number format, navy and red only, text at least 26px.
 */
import assert from 'node:assert/strict';
import { grossIssuerVolume, totals } from './issuance';
import { cardData, cardSvg, fmtDate, MIN_FONT_PX, NAVY, RED } from './usdcShareCard';

const d = cardData();
const svg = cardSvg(d);

// 1. The card's numbers are the issuance snapshot's.
assert.equal(d.total, grossIssuerVolume());
const usdc = totals().find((t) => t.asset.id === 'USDC')!;
assert.equal(d.rows.find((r) => r.asset === 'USDC')!.gross, usdc.gross);
assert.ok(Math.abs(d.rows.reduce((a, r) => a + r.share, 0) - 1) < 1e-9);

// 2. An as-of date is on the card, and it is the snapshot's.
assert.ok(svg.includes(`Data as of ${fmtDate(d.asOf)}`));

// 3. One number format: every dollar figure is $B with one decimal, every share is % with one decimal.
const texts = [...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
for (const t of texts) {
  for (const m of t.matchAll(/\$[\d,.]+[A-Za-z]*/g)) assert.match(m[0], /^\$\d{1,3}(,\d{3})*\.\dB$/, `dollar format: ${m[0]}`);
  for (const m of t.matchAll(/[\d.]+%/g)) assert.match(m[0], /^\d{1,3}\.\d%$/, `percent format: ${m[0]}`);
}
assert.ok(!/\$\d[\d,.]*T\b/.test(svg), 'no $T figures mixed with $B');

// 4. Navy, red and the white canvas only.
const colors = new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1].toLowerCase()));
assert.deepEqual([...colors].sort(), [NAVY, RED, '#ffffff'].sort());
assert.ok(!/opacity|gradient/i.test(svg), 'no tints');

// 5. Smallest text is MIN_FONT_PX at the 1024px canvas, and the SVG is rendered 1:1 at that width.
assert.match(svg, /width="1024"/);
const sizes = [...svg.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
assert.ok(sizes.length >= texts.length && Math.min(...sizes) >= MIN_FONT_PX, `smallest font ${Math.min(...sizes)}px`);
console.log(`usdcShareCard: ${texts.length} text items, smallest ${Math.min(...sizes)}px, colors ${[...colors].join(' ')}`);
