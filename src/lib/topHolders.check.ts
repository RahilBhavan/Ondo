/** Self-check for the top holders row mapper. Run: npx --yes tsx src/lib/topHolders.check.ts */
import assert from 'node:assert/strict';
import { mapDuneRow } from './topHolders';
import { MOCK_DATA } from './mockData';

const meta = { asOf: '2026-09-24T00:00:00.000Z', source: 'https://dune.com/queries/1' };
const prices = { OUSG: 116.5, USDY: 1.15 };

// Lowercase Dune address resolves to the checksummed registry label.
const flux = mapDuneRow(
  {
    token: 'OUSG',
    address: '0x1dd7950c266fb1be96180a8fdb0591f70200e018',
    balance: '336339.56',
    last_activity: '2026-07-01 18:41:47.000 UTC',
  },
  meta,
  prices
);
assert.equal(flux.address, '0x1dD7950c266fB1be96180a8FDb0591F70200E018');
assert.equal(flux.name, 'Flux Finance fOUSG market');
assert.equal(flux.balance, 336339.56);
assert.ok(Math.abs(flux.tvlUsd - 336339.56 * 116.5) < 1e-6);
assert.equal(flux.lastActivity, '2026-07-01T18:41:47.000Z');
assert.equal(flux.dataSource, 'live');
assert.equal(flux.source, meta.source);

// Unregistered wallet keeps the truncated-address label; USDY uses the USDY price.
const safe = mapDuneRow(
  { token: 'USDY', address: '0xa5b614026dcb1ef6e0e39aa53351b4f4bd225302', balance: 1000, last_activity: '2026-05-18 20:34:47.000 UTC' },
  meta,
  prices
);
assert.equal(safe.name, 'Unknown wallet (0xA5b6...5302)');
assert.ok(Math.abs(safe.tvlUsd - 1150) < 1e-9);

const ok = { token: 'USDY', address: '0xa5b614026dcb1ef6e0e39aa53351b4f4bd225302', balance: 1, last_activity: '2026-05-18 20:34:47.000 UTC' };
assert.throws(() => mapDuneRow({ ...ok, token: 'BUIDL' }, meta, prices), /bad token/);
assert.throws(() => mapDuneRow({ ...ok, address: '0x1234' }, meta, prices));
assert.throws(() => mapDuneRow({ ...ok, balance: 'x' }, meta, prices), /bad balance/);
assert.throws(() => mapDuneRow({ ...ok, balance: 0 }, meta, prices), /bad balance/);
assert.throws(() => mapDuneRow({ ...ok, last_activity: 'nope' }, meta, prices), /bad last_activity/);

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

console.log(`topHolders check ok (${mock.length} mock rows)`);
