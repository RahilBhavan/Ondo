'use client';

import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Data sources',
    content:
      'Total TVL, the chain breakdown and the heatmap come from on-chain reads. Top holders come from Blockscout. Weekly flows and the three flow KPIs come from Dune. Competitor TVL comes from DefiLlama. Every number has a badge: Live is read from its source, Mocked is a dated snapshot shown when the source fails, and Estimated mixes the two. Each source is cached for one hour.',
  },
  {
    title: 'Total TVL and chains (Pillar 3)',
    content:
      'TVL is the total token supply on each chain times the OndoOracle price on Ethereum (0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094, getAssetPrice). Every chain uses that one price. EVM chains are read with totalSupply(). Solana uses getTokenSupply, Sui and Aptos their coin supply, Noble its bank supply, Stellar the Horizon asset record, and the XRP Ledger gateway_balances on the issuer. Bridges burn and mint, so each token is counted once, on the chain where it sits. rUSDY, rOUSG and mUSD wrap tokens already counted and are left out. A failed read shows that row\'s dated snapshot, labeled Mocked.',
  },
  {
    title: 'Top Ethereum holders (Pillar 1)',
    content:
      'The top 15 holders of OUSG and USDY on Ethereum, from the Blockscout token holders API, valued at the OndoOracle price. Names come from a manual address registry first, then Blockscout public name tags. Tags that only repeat a contract class name are ignored. Unnamed wallets show their address.',
  },
  {
    title: 'Weekly mint and redeem (Pillar 2)',
    content:
      'Weekly volume, counts and wallets from Ethereum InstantManager events: OUSG 0x93358db73B6cd4b98D89c8F5f230E81a95c2643a, legacy OUSG 0x2826989983e3a66F0622132D019c2Ae173eb6A43 (Apr 2024 to Apr 2025) and USDY 0xa42613C243b67BF6194Ac327795b926B4b491f15. Subscription is a mint and Redemption is a redeem. USD value is the value the contract emits, so no price oracle is involved. Weeks start Monday 00:00 UTC and the current week is partial. The 4-week KPIs use the last four complete weeks. Only instant mint and redeem count, not transfers, DEX trades or other chains (ADR-005). Query: https://dune.com/queries/8822192.',
  },
  {
    title: 'Competitive benchmark (Pillar 4)',
    content:
      'TVL for Invesco USTB on Superstate, OpenEden TBILL and BlackRock BUIDL comes from DefiLlama. The Ondo row uses the same on-chain total as Total TVL when every chain read succeeds, else DefiLlama. Chain counts and redemption terms quote each issuer\'s own docs, or say Not disclosed. Accounting may differ between products.',
  },
  {
    title: 'Known gaps',
    content:
      'Holders cover Ethereum only. Supply-based TVL counts every token in circulation, including any inventory Ondo itself holds. The Ondo TVL includes BNB Chain and the XRP Ledger, which DefiLlama does not count. The Dune result is the last saved run, not a fresh one: the flows section shows its date, which can be days old.',
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
        <span className="text-[color:var(--mute)]">{isOpen ? '−' : '+'}</span>
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
