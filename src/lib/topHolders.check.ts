/** Self-check for the Blockscout holder mapper. Run: npx tsx src/lib/topHolders.check.ts */
import assert from 'node:assert/strict';
import { assembleHolders, holdersPageUrl, mapHolderItem, mapStellarHolder, publicTag, stellarHoldersPageUrl } from './topHolders';
import { LAST_GOOD } from './lastGood';

const asOf = '2026-09-24T00:00:00.000Z';
const item = (hash: string, value: unknown, tags: unknown[] = [], name: string | null = null) => ({
  address: { hash, name, metadata: tags.length ? { tags } : null },
  value,
});

// Registry label wins over Blockscout tags; value is 18-decimal integer string.
const flux = mapHolderItem(
  item('0x1dd7950c266fb1be96180a8fdb0591f70200e018', '336339561725865749857494', [
    { name: 'Flux Finance: fOUSG Token', tagType: 'name', ordinal: 10 },
  ]),
  'OUSG',
  116.5,
  asOf
);
assert.equal(flux.address, '0x1dD7950c266fB1be96180a8FDb0591F70200E018');
assert.equal(flux.name, 'Flux Finance fOUSG market');
assert.ok(Math.abs(flux.balance - 336339.561725865749857494) < 1e-9);
assert.ok(Math.abs(flux.tvlUsd - flux.balance * 116.5) < 1e-6);
assert.equal(flux.dataSource, 'live');
assert.equal(flux.asOf, asOf);
assert.equal(flux.source, holdersPageUrl('OUSG'));

// Unregistered address with a public name tag: highest-ordinal "name" tag, generic tags ignored.
const gateTags = [
  { name: 'Gate.io: Deposit Address', tagType: 'name', ordinal: 10 },
  { name: 'Exchange', tagType: 'generic', ordinal: 0 },
  { name: 'Gate.io 5', tagType: 'name', ordinal: 0 },
];
const gate = mapHolderItem(item('0xC882b111A75C0c657fC507C04FbFcD2cC984F071', '47579905135026007949704406', gateTags), 'USDY', 1.15, asOf);
assert.equal(gate.name, 'Gate.io: Deposit Address');
assert.ok(Math.abs(gate.balance - 47579905.135026) < 1e-3);

// Safes: contract name and generic / GnosisSafeProxy tags are not owner labels.
const safe = mapHolderItem(
  item('0xa5b614026dcb1ef6e0e39aa53351b4f4bd225302', '1000000000000000000000', [
    { name: 'Smart Account by Safe', tagType: 'generic', ordinal: 0 },
    { name: 'GnosisSafeProxy_56e6_a6a0', tagType: 'name', ordinal: 10 },
  ], 'SafeProxy'),
  'USDY',
  1.15,
  asOf
);
assert.equal(safe.name, 'Unknown wallet (0xA5b6...5302)');
assert.equal(safe.balance, 1000);
assert.ok(Math.abs(safe.tvlUsd - 1150) < 1e-9);

// Sub-1 balances keep their leading zeros.
assert.equal(mapHolderItem(item('0xa5b614026dcb1ef6e0e39aa53351b4f4bd225302', '5000000000000000'), 'OUSG', 1, asOf).balance, 0.005);

assert.equal(publicTag({ metadata: null }), null);
// Ordinal-0 tags and tags repeating the contract name are class names, not owners.
assert.equal(publicTag({ metadata: { tags: [{ name: 'Gate.io 5', tagType: 'name', ordinal: 0 }] } }), null);
assert.equal(
  publicTag({ name: 'CErc20DelegatorKYC', metadata: { tags: [{ name: 'CErc20DelegatorKYC', tagType: 'name', ordinal: 10 }] } }),
  null
);
assert.equal(publicTag({ metadata: { tags: gateTags } }), 'Gate.io: Deposit Address');

// Malformed items throw (caller falls back to mock), and zero is never live.
const ok = '0xa5b614026dcb1ef6e0e39aa53351b4f4bd225302';
assert.throws(() => mapHolderItem(null, 'OUSG', 1, asOf), /address\.hash/);
assert.throws(() => mapHolderItem({ value: '1' }, 'OUSG', 1, asOf), /address\.hash/);
assert.throws(() => mapHolderItem(item('0x1234', '1'), 'OUSG', 1, asOf));
assert.throws(() => mapHolderItem(item(ok, 12), 'OUSG', 1, asOf), /bad value/);
assert.throws(() => mapHolderItem(item(ok, '1.5e18'), 'OUSG', 1, asOf), /bad value/);
assert.throws(() => mapHolderItem(item(ok, '0'), 'OUSG', 1, asOf), /non-positive/);
assert.throws(() => mapHolderItem(item(ok, '1'), 'OUSG', 0, asOf), /non-positive/);
assert.throws(() => mapHolderItem(item(ok, '1'), 'OUSG', NaN, asOf), /non-positive/);

// Stellar record: balance is 1e7 stroops, valued at the given price, cited to stellar.expert.
const G = 'GC635K2GGDMIINZBO6WWLQN6QUVDEBODEYCQ74OLEZUOA37K5E2BXSHC';
const xlm = mapStellarHolder({ address: G, balance: '3532171820000000' }, 1.15, asOf);
assert.equal(xlm.chain, 'stellar');
assert.equal(xlm.token, 'USDY');
assert.equal(xlm.balance, 353217182);
assert.ok(Math.abs(xlm.tvlUsd - 353217182 * 1.15) < 1e-3);
assert.equal(xlm.dataSource, 'live');
assert.equal(xlm.source, stellarHoldersPageUrl);
assert.equal(xlm.name, 'Unknown wallet (GC635K...XSHC)');
assert.throws(() => mapStellarHolder({ address: '0xabc', balance: '1' }, 1, asOf), /bad stellar address/);
assert.throws(() => mapStellarHolder({ address: G, balance: '1.5' }, 1, asOf), /bad balance/);
assert.throws(() => mapStellarHolder({ address: G, balance: '0' }, 1, asOf), /non-positive/);
assert.throws(() => mapStellarHolder({ address: G, balance: '10' }, 0, asOf), /non-positive/);

// Last good snapshot: Ethereum 15 per token plus Stellar USDY 15, sorted, real address shapes, no placeholders.
const stored = LAST_GOOD.topHolders;
const GROUPS = [
  { chain: 'ethereum' as const, token: 'OUSG' as const },
  { chain: 'ethereum' as const, token: 'USDY' as const },
  { chain: 'stellar' as const, token: 'USDY' as const },
];
for (const g of GROUPS) {
  const rows = stored.filter((r) => r.chain === g.chain && r.token === g.token);
  assert.equal(rows.length, 15, `${g.chain} ${g.token} stored rows`);
  rows.forEach((r, i) => i && assert.ok(r.balance <= rows[i - 1].balance, `${g.chain} ${g.token} not sorted`));
}
for (const r of stored) {
  assert.match(r.address, r.chain === 'stellar' ? /^[GC][A-Z2-7]{55}$/ : /^0x[0-9a-fA-F]{40}$/);
  assert.ok(!/^0x1234|^0xabcdef/i.test(r.address), `placeholder address ${r.address}`);
  assert.ok(r.asOf > '2026-10', `${r.address} has no real read date`);
}

// Assembly: a fulfilled group is live; a rejected group falls back to its own last good rows,
// labeled cached with their original date; a group with no last good rows is left out.
const warn = console.warn;
console.warn = () => {};
const liveEth = stored.filter((r) => r.chain === 'ethereum');
const reads: PromiseSettledResult<typeof stored>[] = [
  { status: 'fulfilled', value: liveEth.filter((r) => r.token === 'OUSG') },
  { status: 'fulfilled', value: liveEth.filter((r) => r.token === 'USDY') },
  { status: 'rejected', reason: new Error('stellar.expert down') },
];
const mixed = assembleHolders(GROUPS, reads, stored);
assert.equal(mixed.length, 45);
const fell = mixed.filter((r) => r.chain === 'stellar');
assert.equal(fell.length, 15);
assert.ok(fell.every((r, i) => r.dataSource === 'cached' && r.asOf === stored.filter((s) => s.chain === 'stellar')[i].asOf));
assert.equal(assembleHolders(GROUPS, reads, liveEth).length, 30);
console.warn = warn;

console.log(`topHolders check ok (${stored.length} stored rows)`);
