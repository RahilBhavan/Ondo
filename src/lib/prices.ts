/**
 * OUSG and USDY USD prices from Ondo's on-chain oracle on Ethereum.
 *
 * OndoOracle.getAssetPrice(token) returns a 1e18-scaled USD price. Every chain
 * shares this price (Mantle and BNB oracles return the same USDY value).
 * 1hr in-memory cache. Throws on RPC failure; callers fall back.
 */

import { createPublicClient, formatUnits, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

export const ONDO_ORACLE = '0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094';
export const OUSG_ETHEREUM = '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92';
export const USDY_ETHEREUM = '0x96F6eF951840721AdBF46Ac996b59E0235CB985C';
export const ETHEREUM_RPC = 'https://ethereum-rpc.publicnode.com';

const CACHE_TTL_MS = 60 * 60 * 1000;
const abi = parseAbi(['function getAssetPrice(address) view returns (uint256)']);

export interface TokenPrices {
  OUSG: number;
  USDY: number;
  asOf: string;
  source: string;
}

let cached: { data: TokenPrices; timestamp: number } | null = null;

export async function getTokenPrices(): Promise<TokenPrices> {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  const client = createPublicClient({ chain: mainnet, transport: http(ETHEREUM_RPC, { timeout: 8_000, retryCount: 0 }) });
  const read = (token: `0x${string}`) =>
    client.readContract({ address: ONDO_ORACLE, abi, functionName: 'getAssetPrice', args: [token] });
  const [ousg, usdy] = await Promise.all([read(OUSG_ETHEREUM), read(USDY_ETHEREUM)]);
  const data: TokenPrices = {
    OUSG: Number(formatUnits(ousg, 18)),
    USDY: Number(formatUnits(usdy, 18)),
    asOf: new Date().toISOString(),
    source: `https://etherscan.io/address/${ONDO_ORACLE}#readContract`,
  };
  cached = { data, timestamp: Date.now() };
  return data;
}
