/**
 * Compare the dashboard's on-chain supply reads with an independent explorer, per chain.
 *   npx tsx scripts/verify-supply.ts
 * Explorers (all keyless): Blockscout (Ethereum, Plume), Routescan (Mantle), stellar.expert (Stellar).
 * Exits 1 when any pair differs by more than 0.5%.
 */

import { SUPPLY_SOURCES, fromBaseUnits, getChainTVL } from '../src/lib/chainSupply';

type Explorer = (s: (typeof SUPPLY_SOURCES)[number]) => Promise<{ name: string; supply: number } | null>;

const json = async (url: string) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
};
const addrOf = (s: (typeof SUPPLY_SOURCES)[number]) => (s.reader.kind === 'evm' ? s.reader.address : '');

const explorers: Partial<Record<string, Explorer>> = {
  ethereum: async (s) => {
    const j = await json(`https://eth.blockscout.com/api/v2/tokens/${addrOf(s)}`);
    return { name: 'Blockscout', supply: fromBaseUnits(String(j.total_supply), 18) };
  },
  plume: async (s) => {
    const j = await json(`https://explorer.plume.org/api/v2/tokens/${addrOf(s)}`);
    return { name: 'Blockscout (Plume)', supply: fromBaseUnits(String(j.total_supply), 18) };
  },
  mantle: async (s) => {
    const j = await json(`https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api?module=stats&action=tokensupply&contractaddress=${addrOf(s)}`);
    return { name: 'Routescan', supply: fromBaseUnits(String(j.result), 18) };
  },
  stellar: async (s) => {
    if (s.reader.kind !== 'stellar') return null;
    const j = await json(`https://api.stellar.expert/explorer/public/asset/${s.reader.code}-${s.reader.issuer}`);
    return { name: 'stellar.expert', supply: Number(j.supply) / 1e7 };
  },
};

async function main() {
  const rows = await getChainTVL();
  let bad = 0;
  for (const s of SUPPLY_SOURCES) {
    const ours = rows.find((r) => r.chain === s.chain && r.token === s.token);
    const explorer = explorers[s.chain];
    if (!ours || !explorer) continue;
    try {
      const theirs = await explorer(s);
      if (!theirs) continue;
      const diff = Math.abs(ours.supply - theirs.supply) / Math.max(theirs.supply, 1);
      const ok = ours.dataSource === 'live' && diff <= 0.005;
      if (!ok) bad++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.token} ${s.chain}: dashboard ${ours.supply.toFixed(2)} (${ours.dataSource}), ${theirs.name} ${theirs.supply.toFixed(2)}, diff ${(diff * 100).toFixed(3)}%`);
    } catch (err) {
      bad++;
      console.log(`FAIL ${s.token} ${s.chain}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  process.exit(bad ? 1 : 0);
}

main();
