/**
 * Preload for `npm test`: any outbound network call from a self-check fails the check.
 * Run a check by hand with: npx tsx --import ./scripts/no-network.mjs src/lib/<name>.check.ts
 *
 * Blocks fetch, DNS lookups and TCP/TLS connects (http, https, viem and undici all end up in one of these).
 * Unix-socket connects are left alone, because tsx uses one to talk to its own loader process.
 */
import dns from 'node:dns';
import net from 'node:net';
import tls from 'node:tls';

const refuse = (what) => {
  throw new Error(`network access attempted in an offline check: ${what}`);
};

globalThis.fetch = (input) => refuse(`fetch ${typeof input === 'string' ? input : (input?.url ?? String(input))}`);

for (const fn of ['lookup', 'resolve', 'resolve4', 'resolve6']) dns[fn] = (host) => refuse(`dns.${fn} ${host}`);

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = args[0];
  const unix = typeof first === 'string' || (first && typeof first === 'object' && 'path' in first);
  if (unix) return connect.apply(this, args);
  const host = first && typeof first === 'object' ? `${first.host ?? 'localhost'}:${first.port}` : `port ${first}`;
  return refuse(`tcp connect ${host}`);
};
tls.connect = (...args) => refuse(`tls connect ${JSON.stringify(args[0]?.host ?? args[0])}`);
