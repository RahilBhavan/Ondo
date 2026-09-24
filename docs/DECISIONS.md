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

## ADR-006: Raw-Log Decoding for USDY and Legacy OUSG Inclusion
**Date:** 2026-09-23
**Status:** Accepted
**Context:** Checking Dune showed the current OUSG InstantManager is decoded as
  `ondo_ethereum.ousg_instantmanager_evt_*`, not the `ondofinance_ethereum` tables the
  docs name. The legacy OUSG InstantManager (0x28269899..., Apr 2024 to Apr 2025) is
  decoded under `ondofinance_ethereum`. The USDY InstantManager (0xa42613C2..., Dec 2025
  onward) is not decoded at all, but emits the same Subscription/Redemption events as OUSG.
**Decision:**
  1. Include the legacy OUSG contract. USD value = USDC amount in/out (1e6), USDC at $1.
  2. Decode USDY from `ethereum.logs` by topic0 (topic1 = wallet, data word 4 = USD value).
  3. Save the query on Dune as 8822192 (https://dune.com/queries/8822192).
**Consequences:**
  - OUSG history now starts Apr 2024 instead of Apr 2025
  - USDY history starts Dec 2025, when its InstantManager went live
  - Raw decode was validated by reproducing the decoded OUSG totals exactly
    ($879.79M minted, $514.45M redeemed, 222/222 wallets on 2026-09-23)
  - If Ondo changes the USDY event layout, the raw decode breaks silently; recheck against
    decoded OUSG if totals shift
  - Legacy USD values assume the USDC peg

## ADR-007: Home Page Sources: On-Chain Supply, Blockscout, DefiLlama Instead of Dune
**Date:** 2026-09-24
**Status:** Accepted
**Context:** ADR-001 and ADR-005 planned Dune Transfer events for holders, per-chain TVL
  and the benchmark. Three problems: the Dune account hit its datapoint limit and cannot
  re-execute queries; non-EVM chains (Solana, Sui, Aptos, Noble, Stellar, XRPL) are not on
  Dune, so half the heatmap would stay mocked; and every Dune read needs an API key.
**Decision:** Keep Dune only for weekly mint/redeem flows (query 8822192). Use:
  1. Total TVL, chain breakdown, heatmap: total supply read on each chain (RPC or chain API)
     × the Ethereum OndoOracle price (src/lib/chainSupply.ts, src/lib/prices.ts)
  2. Top holders: Blockscout token holders API, Ethereum only (src/lib/topHolders.ts)
  3. Benchmark: DefiLlama TVL per product; the Ondo row uses the on-chain total when every
     chain read is live, so it matches Total TVL (src/lib/benchmark.ts)
**Consequences:**
  - All 13 chains are live; no key needed for anything but Dune
  - Supply-based TVL counts any Ondo-held inventory, and includes BNB and XRPL, which
    DefiLlama leaves out, so Ondo TVL runs above DefiLlama's
  - Holders are Ethereum only
  - Flow data is only as fresh as the last Dune run; the page shows its date
  - Each getter falls back to a dated, labeled snapshot in mockData.ts (ADR-002 still holds)
