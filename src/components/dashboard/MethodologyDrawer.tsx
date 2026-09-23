'use client';

import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Data sources',
    content:
      'All on-chain data is sourced from Dune Analytics using decoded event tables from the ondofinance namespace. Live data refreshes hourly. Estimated data uses on-chain values with manual address mapping. Mocked data uses realistic values from Ondo public disclosures.',
  },
  {
    title: 'TVL by issuer (Pillar 1)',
    content:
      'TVL is computed from net ERC-20 Transfer events for OUSG and USDY tokens. Issuer attribution relies on a manual address registry — addresses not in the registry display as "Unknown Wallet." OUSG\'s internal backing composition is not on-chain.',
  },
  {
    title: 'Mint/redeem velocity (Pillar 2)',
    content:
      'Weekly volume, counts, and wallets over full history from Ethereum InstantManager events: OUSG 0x93358db73B6cd4b98D89c8F5f230E81a95c2643a, legacy OUSG 0x2826989983e3a66F0622132D019c2Ae173eb6A43 (Apr 2024 to Apr 2025), and USDY 0xa42613C243b67BF6194Ac327795b926B4b491f15. Subscription is a mint, Redemption is a redeem. USD value is depositUSDValue / redemptionUSDValue, 1e18-scaled and emitted by the contract (no price oracle). Weeks start Monday 00:00 UTC (DuneSQL DATE_TRUNC(\'week\')); the current week is partial. Wallets are distinct subscriber / redeemer addresses; KYC ids are not used. Scope: instant mint and redeem only, not secondary transfers, DEX trades, bridged balances, or other chains (ADR-005). Legacy OUSG USD value is the USDC amount in or out, with USDC taken at $1. USDY is not decoded on Dune, so it is read from raw logs with the OUSG event signatures, a method validated against the decoded OUSG totals; USDY history starts Dec 2025. Query: https://dune.com/queries/8822192. Redemptions are atomic, so there is no settlement delay to measure.',
  },
  {
    title: 'Liquidity heatmap (Pillar 3)',
    content:
      'Cross-chain TVL from Transfer events on EVM chains indexed by Dune. Non-EVM chains (Solana, Sui, Aptos, Stellar, Noble) use mocked values from public disclosures and bridge transfer data. Each cell is labeled with its data source.',
  },
  {
    title: 'Competitive benchmark (Pillar 4)',
    content:
      'Nexus data is live from Dune. Superstate and OpenEden TVL from Dune token transfers. Franklin Templeton data from public disclosures (may lag). Redemption speed claims are from official documentation. Competitor accounting conventions may differ.',
  },
  {
    title: 'Caching',
    content:
      'All Dune queries are cached with 1-hour TTL. If Dune is unreachable, the dashboard falls back to mock data. Cache key is query ID; invalidation is TTL-based only.',
  },
] as const;

export function MethodologyDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="methodology" className="scroll-mt-20 rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-[color:var(--ink)]"
      >
        <span>Methodology and data sources</span>
        <span className="text-[color:var(--mute)]">{isOpen ? '\u2212' : '+'}</span>
      </button>

      {isOpen && (
        <div className="px-5 py-5 space-y-4 border-t border-[color:var(--hairline)]">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-medium text-[color:var(--ink)] mb-1">{section.title}</h4>
              <p className="text-sm text-[color:var(--body)] leading-relaxed">{section.content}</p>
            </div>
          ))}
          <p className="text-xs font-mono text-[color:var(--mute)] pt-3 border-t border-[color:var(--hairline)]">
            Full methodology: docs/METHODOLOGY.md | Contract research: docs/CONTRACT_RESEARCH.md
          </p>
        </div>
      )}
    </div>
  );
}
