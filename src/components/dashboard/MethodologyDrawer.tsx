'use client';

import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Data Sources',
    content:
      'All on-chain data is sourced from Dune Analytics using decoded event tables from the ondofinance namespace. Live data refreshes hourly. Estimated data uses on-chain values with manual address mapping. Mocked data uses realistic values from Ondo public disclosures.',
  },
  {
    title: 'TVL by Issuer (Pillar 1)',
    content:
      'TVL is computed from net ERC-20 Transfer events for OUSG and USDY tokens. Issuer attribution relies on a manual address registry — addresses not in the registry display as "Unknown Wallet." OUSG\'s internal backing composition is not on-chain.',
  },
  {
    title: 'Mint/Redeem Velocity (Pillar 2)',
    content:
      'Volume and frequency metrics from InstantManager Subscription and Redemption events on Ethereum. Redemptions are atomic (single transaction) — settlement time delta is not applicable. USD values are emitted directly by the contract.',
  },
  {
    title: 'Liquidity Heatmap (Pillar 3)',
    content:
      'Cross-chain TVL from Transfer events on EVM chains indexed by Dune. Non-EVM chains (Solana, Sui, Aptos, Stellar, Noble) use mocked values from public disclosures and bridge transfer data. Each cell is labeled with its data source.',
  },
  {
    title: 'Competitive Benchmark (Pillar 4)',
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
    <div className="border-t border-nexus-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span className="uppercase tracking-wider">Methodology & Data Sources</span>
        <span className="text-sm">{isOpen ? '\u2212' : '+'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-mono text-slate-300 mb-1">{section.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{section.content}</p>
            </div>
          ))}
          <p className="text-[10px] text-slate-600 pt-2 border-t border-nexus-border/50">
            Full methodology: docs/METHODOLOGY.md | Contract research: docs/CONTRACT_RESEARCH.md
          </p>
        </div>
      )}
    </div>
  );
}
