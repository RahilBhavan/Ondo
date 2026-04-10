# Ondo Nexus Dashboard — Data Methodology

**Version:** 1.0
**Last Updated:** 2026-04-09

This document explains how every number on the dashboard is sourced, computed, and labeled. If a metric cannot be verified from on-chain data alone, this document explains why and what assumptions fill the gap.

---

## Data Source Taxonomy

Every data point on the dashboard carries one of three labels:

| Label | Meaning | Criteria |
|-------|---------|----------|
| **Live** | Sourced directly from on-chain events via Dune Analytics | Updated within 1hr, no manual assumptions, independently verifiable |
| **Estimated** | Derived from on-chain data with documented assumptions | Computation uses on-chain inputs but requires manual mapping or inference |
| **Mocked** | Realistic value based on public disclosures | No on-chain source; value derived from Ondo disclosures or comparable protocols |

The `DataSourceBadge` component renders this label inline with every metric. The methodology drawer explains each gap.

---

## Pillar 1: TVL by Issuer

**What we track:** Total value of OUSG and USDY tokens held per address, mapped to known institutions via a manual address registry.

**Data source:** `Transfer` events from OUSG (`0x1B19C193...`) and USDY (`0x96F6eF95...`) token contracts on Ethereum. Net balance = sum of incoming transfers - sum of outgoing transfers per address.

**Institution mapping:** The `addressRegistry.ts` file maps known wallet addresses to institution names. Sources:
- Ondo docs (Coinbase Prime custodian addresses)
- Public wallet labels from Etherscan
- Manual research of large holders

**Data source label:** **Estimated** — TVL values are live on-chain, but issuer attribution relies on manual address mapping that may be incomplete.

**Known gaps:**
- Addresses not in the registry show as "Unknown Wallet (0x...)"
- Institutional wallets using smart contract intermediaries may be misattributed
- OUSG's backing composition (which third-party assets) is NOT on-chain

---

## Pillar 2: Mint/Redemption Volume & Frequency

**What we track:** Daily aggregate USD volume and transaction count for mints and redemptions, with 90-day rolling window.

**Data source:** `Subscription` and `Redemption` events from:
- OUSG InstantManager (`0x93358db7...`)
- USDY InstantManager (`0xa42613C2...`)

Both emit `depositUSDValue` / `redemptionUSDValue` fields directly — no price oracle needed.

**Data source label:** **Live** — all values sourced directly from decoded event logs.

**Design note (PRD deviation):** The PRD originally specified settlement time delta (time between redemption request and settlement). Research found that InstantManager redemptions are **atomic** — they execute in a single transaction with zero settlement delay. There is no `RedemptionRequested`/`RedemptionSettled` event pair to measure.

Pillar 2 was redesigned to track **volume and frequency metrics**:
- Daily mint volume (USD)
- Daily redeem volume (USD)
- Daily transaction count (mint + redeem separately)
- Average transaction size (USD)
- Net flow (mint - redeem) as adoption signal

See ADR-004 in DECISIONS.md.

---

## Pillar 3: Liquidity Depth Heatmap

**What we track:** TVL distribution across an issuer/asset x chain matrix.

**Data source:** `Transfer` events from USDY token contracts on each chain where Dune has coverage. OUSG is primarily Ethereum — included as single row.

**Chains with Dune coverage (Live):** Ethereum, Mantle, Arbitrum, Polygon
**Chains without Dune coverage (Mocked):** Solana, Sui, Aptos, Noble, Stellar, Plume, Sei

**Data source label:** Mixed — **Live** for EVM chains with Dune coverage, **Mocked** for non-EVM chains.

**Known gaps:**
- Non-EVM chains (Solana, Sui, Aptos, etc.) require dedicated indexers not available through Dune
- Mocked values for these chains are derived from bridge transfer volumes and public disclosures
- Each mocked cell is labeled with "~" prefix and source citation

---

## Pillar 4: Competitive Benchmark

**What we track:** Side-by-side comparison of Nexus (OUSG/USDY) vs. Superstate (USTB), OpenEden (TBILL), and Franklin Templeton (BENJI) on:
- TVL
- 30-day volume
- Chain availability
- Redemption characteristics

**Data sources by competitor:**

| Competitor | TVL Source | Volume Source | Redemption Source |
|------------|-----------|--------------|-------------------|
| Nexus (OUSG/USDY) | Dune (Live) | Dune InstantManager events (Live) | Documented as instant/atomic |
| Superstate USTB | Dune USTB transfers (Live) | Dune transfers (Live) | Public docs (Estimated) |
| OpenEden TBILL | Dune TBILL transfers (Live) | Dune transfers (Live) | Public docs (Estimated) |
| Franklin Templeton BENJI | Public disclosures (Mocked) | Public reports (Mocked) | Public docs (Estimated) |

**Staleness policy:** If a competitor data point is >30 days old, it renders in muted color with a warning tooltip showing the data date.

**Data source label:** Mixed — per-cell labeling based on source freshness and type.

**Known gaps:**
- Competitor accounting conventions may differ (e.g., TVL includes/excludes accrued yield)
- Franklin Templeton data is least reliable — primarily from press releases
- "Redemption speed" comparison is approximate — different products have fundamentally different architectures

---

## Cross-Chain Data Strategy

InstantManager contracts (mint/redeem events) exist **only on Ethereum**. All other chains have bridged token contracts via LayerZero OFT adapters.

| Data Type | Source | Chains |
|-----------|--------|--------|
| Mint/Redeem events | InstantManager decoded events | Ethereum only |
| Token holdings/TVL | ERC-20 Transfer events | All EVM chains on Dune |
| Bridge activity | OFT adapter Transfer events | Ethereum, Mantle, Arbitrum |
| Non-EVM holdings | Public disclosures | Solana, Sui, Aptos, etc. (Mocked) |

---

## Caching Strategy

All Dune queries are cached at the API route layer with 1-hour TTL. This:
- Avoids Dune free tier rate limits (10 req/min)
- Provides consistent data during cache window
- Falls back to mock data if Dune is unreachable

Cache key: query ID + parameters. Cache invalidation: TTL expiry only (no manual purge needed for v1).

---

## Sources

All data sources are cited inline in the dashboard via the `MethodologyDrawer` component. Primary sources:
- Dune Analytics `ondofinance` namespace (decoded contract tables)
- Ondo Finance official documentation (docs.ondo.finance)
- Ondo Finance blog (ondo.finance/blog)
- Etherscan verified contracts
- Competitor public disclosures and documentation
