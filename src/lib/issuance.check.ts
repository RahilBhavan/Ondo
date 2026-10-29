/**
 * Self-check for the flows tracker. Run: npx tsx src/lib/issuance.check.ts
 * Reconciles the log-derived flows with independent sources and pins the claims the summary makes.
 */
import assert from 'node:assert/strict';
import { episodeResults, episodes, grossIssuerVolume, issuanceSummary, logVsSupply, supplyTotalAt, totals, zDuring } from './issuance';

const B = 1e9;
const t = new Map(totals().map((x) => [x.asset.id, x]));

// 1. Ondo agrees with the existing pipeline's documented totals (CONTRACT_RESEARCH, 2026-09-23); later weeks only add,
// so the floor is the documented total and the cap only catches a decode blow-up (the scheduled refresh grows these).
assert.ok(t.get('OUSG')!.mint >= 1334e6 && t.get('OUSG')!.mint < 10 * B, `OUSG mints ${t.get('OUSG')!.mint}`);
assert.ok(t.get('USDY')!.mint >= 174e6 && t.get('USDY')!.mint < 5 * B, `USDY mints ${t.get('USDY')!.mint}`);

// 2. The 300 trillion PYUSD mistake is excluded, PYUSD volume is the size of its supply history.
assert.ok(t.get('PYUSD')!.mint < 100 * B, 'PYUSD outlier leaked in');

// 3. Ethereum mints less burns (CCTP included) tracks DefiLlama's Ethereum supply change, within 25% for USDC and PYUSD.
for (const a of ['USDC', 'PYUSD'] as const) {
  const { logNet, supplyChange, diff } = logVsSupply(a);
  console.log(a, 'log net', (logNet / B).toFixed(2), 'DefiLlama Ethereum change', (supplyChange / B).toFixed(2), `diff ${(diff * 100).toFixed(0)}%`);
  assert.ok(diff < 0.25, `${a} logs and supply disagree by ${diff}`);
}
// USDT: Tether destroys and re-issues outside the Issue/Redeem path (e.g. blacklisted funds), so only the sign and order of magnitude.
const usdt = logVsSupply('USDT');
assert.ok(usdt.logNet > 0.5 * usdt.supplyChange && usdt.logNet < 1.5 * usdt.supplyChange, 'USDT logs and supply disagree');

// 4. Global supply total matches DefiLlama's headline (USDC about $72.6B on 2026-10-17).
assert.ok(supplyTotalAt('USDC', '2026-10-12') > 70 * B && supplyTotalAt('USDC', '2026-10-12') < 76 * B);

// 5. Headline is above $0.9T and below $1.1T.
assert.ok(grossIssuerVolume() > 0.9e12 && grossIssuerVolume() < 1.1e12, `gross ${grossIssuerVolume()}`);

// 5b. The CCTP caveat: counting CCTP transfers would push the same data to about $1.2T.
const withCctp = issuanceSummary().grossWithCctpUsd;
assert.ok(withCctp > 1.15e12 && withCctp < 1.25e12, `with CCTP ${withCctp}`);
assert.ok(Math.abs(withCctp - grossIssuerVolume() - issuanceSummary().cctpBridgedUsd) < 1);

// 6. Claims in app/summary/page.tsx.
assert.equal(episodes().length, 2);
const r = episodeResults();
const z = (a: Parameters<typeof zDuring>[1], e: number) => zDuring(r, a, e)!;
assert.ok(z('USDC', 0) > 0.3 && z('USDT', 0) > 0.3, 'stablecoins above norm in 2024');
assert.ok(z('BUIDL', 0) < 0 && z('OUSG', 0) < 0, 'funds below norm in 2024');
assert.ok(z('BUIDL', 1) < z('BUIDL', 0), 'BUIDL weaker in 2025');
assert.ok(z('USDT', 1) > 0.2, 'USDT above norm in 2025');
assert.ok(Math.abs(z('USDC', 1)) < 0.2, 'USDC about average in 2025');
assert.ok(z('OUSG', 1) > z('OUSG', 0), 'OUSG recovered in 2025');
assert.equal(r.find((x) => x.asset === 'BUIDL' && x.episode.firstCut === episodes()[1].firstCut)!.percentile, 0, 'BUIDL 2025 is its lowest window');

console.log('issuance.check: ok');
