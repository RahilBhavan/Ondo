/**
 * Known institutional address → name mappings for issuer attribution.
 *
 * Since Ondo's on-chain events don't tag issuer identity (subscriberId is an
 * opaque KYC hash), we maintain a manual registry of known addresses.
 *
 * Sources: Ondo docs (docs.ondo.finance/addresses), Etherscan labels,
 * manual research of large holders.
 *
 * See docs/CONTRACT_RESEARCH.md Q3 for full context.
 */

export interface AddressEntry {
  name: string;
  type: 'custodian' | 'issuer' | 'recipient' | 'protocol' | 'bridge';
  /** Whether this mapping has been verified against official sources */
  verified: boolean;
  /** Source of the attribution */
  source: string;
}

/**
 * Checksummed Ethereum addresses → institution metadata.
 * Add new entries as they are identified from on-chain research.
 */
export const ADDRESS_REGISTRY: Record<string, AddressEntry> = {
  // --- OUSG Infrastructure ---
  '0xF67416a2C49f6A46FEe1c47681C5a3832cf8856c': {
    name: 'Coinbase Prime (OUSG Custodian)',
    type: 'custodian',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },
  '0x72Be8C14B7564f7a61ba2f6B7E50D18DC1D4B63D': {
    name: 'OUSG Recipient',
    type: 'recipient',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },
  '0x0317a350b093F8010837d1b844292555d73ebC2c': {
    name: 'PYUSD Recipient',
    type: 'recipient',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },

  // --- USDY Infrastructure ---
  '0xbDa73A0F13958ee444e0782E1768aB4B76EdaE28': {
    name: 'Coinbase Prime (USDY Custodian)',
    type: 'custodian',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },

  // --- Ondo Protocol Contracts ---
  '0x93358db73B6cd4b98D89c8F5f230E81a95c2643a': {
    name: 'OUSG InstantManager',
    type: 'protocol',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },
  '0xa42613C243b67BF6194Ac327795b926B4b491f15': {
    name: 'USDY InstantManager',
    type: 'protocol',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },

  // --- Bridge ---
  '0xa6275720b3fB1Efe3E6EF2b5BF2293148852307D': {
    name: 'Ondo Bridge (Ethereum OFT)',
    type: 'bridge',
    verified: true,
    source: 'docs.ondo.finance/addresses',
  },
};

/**
 * Resolve a wallet address to a known institution name.
 * Returns the institution name or a truncated address for unknown wallets.
 */
export function resolveAddress(address: string): string {
  const entry = ADDRESS_REGISTRY[address];
  if (entry) return entry.name;
  return `Unknown (${address.slice(0, 6)}...${address.slice(-4)})`;
}

/**
 * Check if an address belongs to Ondo protocol infrastructure
 * (should be excluded from TVL-by-issuer calculations).
 */
export function isProtocolAddress(address: string): boolean {
  const entry = ADDRESS_REGISTRY[address];
  return entry?.type === 'protocol' || entry?.type === 'bridge';
}
