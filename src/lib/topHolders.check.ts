/** Self-check for the Blockscout holder mapper. Run: npx --yes tsx src/lib/topHolders.check.ts */
import assert from 'node:assert/strict';
import { holdersPageUrl, mapHolderItem, publicTag } from './topHolders';
import { MOCK_DATA } from './mockData';

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

// Mock snapshot: 15 per token, checksummed, sorted by balance, no placeholder addresses.
const mock = MOCK_DATA.topHolders;
for (const token of ['OUSG', 'USDY'] as const) {
  const rows = mock.filter((r) => r.token === token);
  assert.equal(rows.length, 15, `${token} mock rows`);
  rows.forEach((r, i) => i && assert.ok(r.balance <= rows[i - 1].balance, `${token} not sorted`));
}
for (const r of mock) {
  assert.equal(r.dataSource, 'mocked');
  assert.match(r.address, /^0x[0-9a-fA-F]{40}$/);
  assert.ok(!/^0x1234|^0xabcdef/i.test(r.address), `placeholder address ${r.address}`);
}
assert.equal(mock.find((r) => r.address.startsWith('0xC882'))?.name, 'Gate.io: Deposit Address');

console.log(`topHolders check ok (${mock.length} mock rows)`);
