# Architecture Decision Records

## ADR-001: Dune over Custom Subgraph
**Date:** 2026-04-09
**Status:** Accepted
**Context:** Solo build, 28-day timeline, learning-as-we-go constraints
**Decision:** Use Dune Analytics managed indexing + SparkSQL instead of building
  a custom subgraph on The Graph
**Consequences:**
  - Faster to ship, less infrastructure to maintain
  - Rate limited on free tier — requires aggressive caching
  - Less control over indexing granularity
  - Acceptable for portfolio prototype; custom subgraph is v2 upgrade path

## ADR-002: Mock Data as First-Class Feature
**Date:** 2026-04-09
**Status:** Accepted
**Context:** Nexus may have limited third-party issuer activity at launch
**Decision:** Build typed mockData.ts layer with source citations and DataSourceBadge
  UI component from day one, not as a fallback
**Consequences:**
  - Dashboard is functional and presentable regardless of on-chain activity
  - Methodology transparency becomes a differentiator, not a caveat
  - Requires discipline to maintain type parity between mock and live data

## ADR-003: Track OUSG/USDY as Nexus Proxy
**Date:** 2026-04-09
**Status:** Accepted
**Context:** Research revealed Ondo Nexus has no dedicated smart contracts. Nexus is a
  business initiative that diversifies OUSG's backing to include third-party tokenized
  Treasuries (Franklin Templeton, WisdomTree, Wellington, Fundbridge Capital). All
  on-chain activity flows through existing OUSG/USDY InstantManager contracts.
**Decision:** Dashboard tracks OUSG + USDY InstantManager events on Ethereum as the
  on-chain representation of Nexus activity. Dashboard title remains "Nexus Adoption
  Intelligence" but methodology docs explain the mapping.
**Consequences:**
  - No separate contract to index — simpler data layer
  - "Nexus adoption" is an interpretation layer on top of OUSG/USDY activity
  - Methodology transparency is critical — must explain this clearly
  - See docs/CONTRACT_RESEARCH.md for full findings

## ADR-004: Pillar 2 Pivot — Volume/Frequency over Settlement Delta
**Date:** 2026-04-09
**Status:** Accepted
**Context:** PRD specified Pillar 2 as "settlement time delta" (pairing RedemptionRequested
  and RedemptionSettled events). Research found InstantManager redemptions are atomic —
  single transaction, zero delay. No event pair exists to compute settlement time.
**Decision:** Redesign Pillar 2 to track mint/redeem volume and frequency metrics:
  daily USD volume, transaction counts, average transaction size, net flow (mint - redeem).
**Consequences:**
  - Loses the "settlement speed" narrative from the PRD
  - Gains richer volume/adoption trend data
  - Net flow (mint - redeem) becomes a stronger adoption signal
  - Competitive benchmark can still reference Ondo's "instant" claim qualitatively

## ADR-005: Ethereum-First Data Strategy
**Date:** 2026-04-09
**Status:** Accepted
**Context:** InstantManager contracts (where mint/redeem events fire) exist only on
  Ethereum. Other chains have bridged USDY tokens via LayerZero OFT adapters. Non-EVM
  chains (Solana, Sui, Aptos) lack Dune coverage entirely.
**Decision:** Two-tier data strategy:
  1. Ethereum: InstantManager events for mint/redeem + Transfer events for TVL
  2. Other EVM chains: Transfer events only (for TVL/holdings)
  3. Non-EVM chains: Mocked with public disclosure data
**Consequences:**
  - Mint/redeem metrics are Ethereum-only (most activity is here anyway)
  - Heatmap has mixed data sources — Live for EVM, Mocked for non-EVM
  - Each cell's data source is labeled via DataSourceBadge
  - v2 could add Solana indexing via Flipside or custom RPC
