# Product Requirements Document
## Ondo Nexus Adoption Intelligence Dashboard
**Version:** 1.0  
**Author:** Rahil Bhavan  
**Status:** Draft  
**Last Updated:** April 2026  
**Target Deployment:** nexus.rahilbhavan.com

---

## 1. Executive Summary

Ondo Nexus is a cross-chain instant liquidity layer designed for third-party tokenized Treasury issuers. Its value proposition is only realized if external institutions adopt it — but there is currently no public transparency layer that shows who has onboarded, at what scale, or how redemptions are clearing. For an institutional audience, opacity is an adoption barrier.

The Ondo Nexus Adoption Intelligence Dashboard is an open-source analytics tool that creates this transparency layer. It indexes on-chain activity from Nexus-integrated contracts, computes institutional-grade adoption metrics, benchmarks Nexus against competitors, and presents the data in a publicly accessible, live dashboard.

This is a portfolio project built to demonstrate deep domain knowledge in RWA tokenization infrastructure, on-chain data engineering, and institutional DeFi analytics.

---

## 2. Problem Statement

### 2.1 The Adoption Friction Problem
Ondo Nexus depends on a network effect: liquidity quality improves as more issuers onboard. But prospective issuers evaluating Nexus face a credibility gap — there is no canonical, real-time source of truth on:
- Which institutions are already live on Nexus
- Whether redemption speed claims hold up empirically
- How Nexus compares to alternatives on verifiable metrics

### 2.2 The Ecosystem Credibility Gap
The broader RWA sector suffers from a trust infrastructure deficit. Issuers publish marketing metrics. Protocols publish whitepapers. Neither provides the kind of independently verifiable, on-chain-sourced data that institutional risk teams actually trust.

### 2.3 Why This Tool Doesn't Exist Yet
Building it correctly requires: locating and parsing Nexus smart contracts, writing performant on-chain queries, normalizing cross-chain data into a coherent schema, and presenting it with institutional-grade clarity. That combination has not been assembled into a public good for this specific protocol.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Build a publicly accessible, live dashboard tracking Ondo Nexus adoption metrics
- Create a transparent methodology layer so every number is independently verifiable
- Serve as a proof-of-work artifact demonstrating on-chain data engineering capability
- Benchmark Nexus against Superstate, OpenEden, and Franklin Templeton on identical metrics
- Deploy a working v1 within 28 days of contract research completion

### 3.2 Non-Goals
- This is **not** a trading tool or yield optimizer
- This is **not** a real-time alerting system (v2 consideration)
- This is **not** built for retail investors — the UX and framing targets institutional researchers
- This is **not** a formal audit of Ondo's contracts or claims
- Auto-generated weekly PDF digest is explicitly **deferred to v2**

---

## 4. Target Users

### Primary: Institutional Adopters (Prospective Nexus Issuers)
Treasury desks, tokenized fund managers, and fintech teams at institutions evaluating whether to integrate Nexus as their liquidity layer. They need: volume proof, settlement reliability, and competitive context.

**Key question they're answering:** *Is Nexus liquid enough and fast enough for us to trust with our redemption flow?*

### Secondary: Ondo Protocol Team
Product and BD teams at Ondo who can use the dashboard as a sales tool, an ecosystem credibility signal, and a public feedback mechanism on adoption pace.

**Key question they're answering:** *Where is adoption concentrated, and where are the gaps?*

### Tertiary: Recruiters & Technical Evaluators
Engineering leads and research analysts at RWA-adjacent firms evaluating the builder's depth. They read the methodology doc and GitHub, not just the dashboard.

**Key question they're answering:** *Does this person actually understand on-chain data architecture, or did they just plug into an API?*

---

## 5. Core Metrics (The Four Pillars)

These are the four metrics the dashboard tracks, ordered by institutional decision-making importance.

### Pillar 1: TVL by Issuer
**What it measures:** Total value locked in Nexus, segmented by third-party issuer (or by contract address where issuer identity isn't directly on-chain)  
**Why it matters:** Proves the network effect is real. Prospective issuers want to see other institutions already committed.  
**Data source:** Mint/redeem event logs from Nexus contracts, aggregated by depositor address. Known institutional addresses mapped manually via a verified address registry in the codebase.  
**Display:** Stacked bar chart + sortable table. Shows both current snapshot and 30-day trend.  
**Honest gap:** If issuer identity is not emitted as a tagged event, attribution relies on a manual address mapping that the dashboard documents openly.

### Pillar 2: Mint/Redemption Velocity
**What it measures:** Volume of mint and redemption transactions over time (daily/weekly), plus average time-to-settle per redemption request  
**Why it matters:** Settlement speed is Nexus's core differentiator. If the data supports the claim, it's the most powerful proof point in the system.  
**Data source:** Pairing `RedemptionRequested` and `RedemptionSettled` events (or equivalent), computing delta timestamps.  
**Display:** Dual-axis line chart (volume + rolling avg settlement time). Chain-segmented.  
**Honest gap:** Cross-chain settlement timing requires matching events across different chains — where bridge timing creates noise, we report median and flag outliers.

### Pillar 3: Liquidity Depth Heatmap
**What it measures:** Where Nexus liquidity is concentrated vs. thin, across the issuer × chain matrix  
**Why it matters:** Depth asymmetry is a risk signal. An institution considering Solana integration needs to know if Nexus liquidity on Solana is $2M or $200M.  
**Data source:** Derived from TVL by issuer, disaggregated by chain.  
**Display:** Custom SVG grid — X axis = issuer/asset, Y axis = chain. Color intensity = liquidity depth. Estimated cells labeled with "~".  
**Design note:** This is the hero component. It should be visually unmistakable at a glance.

### Pillar 4: Competitive Benchmark
**What it measures:** Nexus vs. Superstate (USTB), OpenEden (TBILL), and Franklin Templeton (BENJI) on: TVL, redemption speed, chain availability, issuer count  
**Why it matters:** Prospective adopters are evaluating alternatives. A side-by-side comparison on-chain forces honest positioning.  
**Data source:** Dune community dashboards for each competitor + public disclosures. All sources cited inline.  
**Display:** Comparison table with sparklines. Color-coded advantage/disadvantage per cell.  
**Honest gap:** Competitor data may lag or use different accounting conventions. Methodology notes are mandatory for each competitor column.

---

## 6. Technical Architecture

### 6.1 Stack
| Layer | Technology | Rationale |
|---|---|---|
| Data indexing | Dune Analytics (SparkSQL) | Managed, no custom subgraph required, Ondo contracts likely partially indexed already |
| Data API | Dune API v1 | REST interface to query execution results |
| Caching | Next.js API Routes + in-memory / Supabase (1hr TTL) | Avoid Dune rate limits on every page load |
| Frontend framework | Next.js 14 (App Router) + TypeScript | Portfolio-standard, SSR for SEO, familiar from MECG work |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Charts | Recharts (primary) + custom SVG (heatmap) | Recharts handles standard charts; heatmap needs custom control |
| On-chain reads | viem | Direct RPC reads for any real-time state not covered by Dune |
| Deployment | Vercel | Zero-config, preview deployments |
| Mock data layer | `mockData.ts` with typed schema | Realistic fallback for any metric without live on-chain coverage |

### 6.2 Data Flow
```
Ondo Contracts (Ethereum / Mantle / etc.)
        ↓  (indexed by)
  Dune Analytics (SparkSQL queries)
        ↓  (via)
  Dune API → Next.js API Routes (cached, 1hr TTL)
        ↓  (consumed by)
  React Components (Recharts + custom SVG)
        ↓  (served via)
  Vercel → nexus.rahilbhavan.com
```

### 6.3 Component Architecture
```
/app
  page.tsx                    # Dashboard root — layout + data orchestration
  /api
    dune/[queryId]/route.ts   # Cached Dune API proxy
    metrics/route.ts          # Aggregated metrics endpoint

/components
  /dashboard
    MetricCard.tsx            # KPI summary cards (TVL, avg settlement time)
    TVLByIssuerChart.tsx      # Stacked bar — Pillar 1
    MintRedeemVelocity.tsx    # Dual-axis line — Pillar 2
    LiquidityHeatmap.tsx      # Custom SVG grid — Pillar 3 (hero)
    CompetitiveBenchmark.tsx  # Comparison table — Pillar 4
    ChainBreakdown.tsx        # Supporting: chain-level pie/donut
    MethodologyDrawer.tsx     # Expandable source + gap documentation
  /ui
    DataSourceBadge.tsx       # "Live" vs "~Estimated" inline label
    LoadingSkeleton.tsx
    Tooltip.tsx

/lib
  dune.ts                     # Dune API client + polling logic
  types.ts                    # Shared data schema (IssuerMetric, RedemptionEvent, etc.)
  mockData.ts                 # Typed mock values with source citations
  addressRegistry.ts          # Known institution → wallet address mapping

/queries                      # Raw Dune SQL files (version controlled)
  tvl_by_issuer.sql
  mint_redeem_volume.sql
  settlement_time_delta.sql
  chain_breakdown.sql
```

### 6.4 Dune Query Specifications

**Query 1 — TVL by Issuer**
```sql
-- Aggregate net TVL per depositor address from Nexus mint/redeem events
-- Join against address registry CTE for institution name resolution
-- Output: issuer_name, tvl_usd, last_updated
```

**Query 2 — Daily Mint/Redeem Volume**
```sql
-- Daily aggregate of mint and redemption transaction counts + USD volume
-- Segmented by chain (ethereum, mantle, etc.)
-- 90-day rolling window
-- Output: date, chain, mint_volume_usd, redeem_volume_usd, tx_count
```

**Query 3 — Settlement Time Delta**
```sql
-- Match RedemptionRequested events to corresponding RedemptionSettled events
-- Compute timestamp delta in seconds
-- Report: median, p75, p95, by chain
-- Output: chain, median_seconds, p75_seconds, p95_seconds, sample_count
```

**Query 4 — Chain Breakdown**
```sql
-- TVL and tx count distribution across all supported chains
-- Output: chain, tvl_usd, tx_count_30d, pct_of_total
```

### 6.5 Mock Data Strategy
Any metric without sufficient on-chain coverage gets a mocked value. Rules:
1. Realistic ranges derived from Ondo's public disclosures and comparable protocols
2. All mocked values stored in `mockData.ts` with inline source citation
3. Every mocked data point rendered with a `~` prefix and a `DataSourceBadge` set to "Estimated"
4. The `MethodologyDrawer` component documents every gap explicitly

This is not a limitation — it's a feature. It demonstrates that the builder understands where the data is clean and where it isn't.

---

## 7. UX & Design Specifications

### 7.1 Design Direction
**Aesthetic target:** Institutional dark terminal — think Bloomberg Terminal meets Dune Analytics. Not consumer crypto. Not purple gradients. Dark background (#0A0E17 or equivalent), monospace data typography, sharp accent color (green or amber — to be decided in Phase 1). Every element signals: *this was built for professionals who read balance sheets.*

### 7.2 Layout
- **Top bar:** Protocol name, last updated timestamp, live/estimated indicator, GitHub link
- **KPI row:** 4 metric cards — Total Nexus TVL, Active Issuers, Avg Settlement Time, 30D Volume
- **Main grid (2-column):** TVL by Issuer (left, 60%) + Chain Breakdown (right, 40%)
- **Full-width:** Liquidity Depth Heatmap (hero section, full bleed)
- **Full-width:** Mint/Redeem Velocity chart with chain filter
- **Full-width:** Competitive Benchmark table
- **Footer:** Methodology drawer trigger + data source links + GitHub

### 7.3 Data Integrity Indicators
Every data point must be labeled with one of three states:
- 🟢 **Live** — sourced directly from on-chain events via Dune, updated within 1hr
- 🟡 **Estimated** — derived from on-chain data with manual assumptions (documented)
- ⚪ **Mocked** — realistic value based on public disclosures, no on-chain source

This taxonomy is explained in the methodology drawer and in the README.

---

## 8. Phased Build Plan

### Phase 0 — Contract Research (Days 1–3)
- [ ] Locate Nexus contract addresses on Ethereum, Mantle, and any other chains
- [ ] Pull and read contract ABIs from Etherscan
- [ ] Identify event schema — specifically whether issuer identity is tagged in events
- [ ] Search Dune for existing Ondo dashboards — fork anything useful
- [ ] Document findings in `METHODOLOGY.md` before writing any code

**Exit criteria:** Know exactly what data exists, what's missing, and what will be mocked.

### Phase 1 — Data Layer (Days 4–10)
- [ ] Write all 4 Dune queries against live contract data
- [ ] Validate query outputs — check for gaps and edge cases
- [ ] Build `mockData.ts` for any uncovered metrics
- [ ] Build Dune API client with polling + caching
- [ ] Define TypeScript types for all data shapes

**Exit criteria:** Can fetch real (or realistic mock) data for all 4 pillars via a local API call.

### Phase 2 — Frontend Build (Days 11–20)
- [ ] Next.js project scaffold + Tailwind + Recharts
- [ ] MetricCard, ChainBreakdown, TVLByIssuerChart
- [ ] MintRedeemVelocity with chain filter
- [ ] LiquidityHeatmap (custom SVG — allocate 2 days minimum)
- [ ] CompetitiveBenchmark table
- [ ] DataSourceBadge + MethodologyDrawer
- [ ] Responsive layout pass

**Exit criteria:** All 4 pillars rendered with live or mock data, methodology layer visible.

### Phase 3 — Polish & Deploy (Days 21–28)
- [ ] Performance audit — cache all Dune calls, no waterfalls on page load
- [ ] README with architecture diagram (Mermaid) + query documentation
- [ ] `METHODOLOGY.md` — complete source citations and gap documentation
- [ ] Vercel deployment + custom subdomain
- [ ] Paragraph.xyz technical write-up (600 words)
- [ ] Twitter/X thread with heatmap screenshot

**Exit criteria:** Live at nexus.rahilbhavan.com, GitHub public, write-up published.

---

## 9. Competitive Benchmark Methodology

| Metric | Nexus Source | Superstate Source | OpenEden Source | Franklin Templeton Source |
|---|---|---|---|---|
| TVL | Dune (live) | Dune USTB transfers | Dune TBILL transfers | Public disclosures |
| Avg Redemption Time | Settlement delta query | Public docs | Public docs / known |
| Chain Availability | Contract deployment scan | Their docs | Their docs | Stellar + Polygon |
| Active Issuers | Address registry | N/A (single issuer) | N/A (single issuer) | N/A |
| 30D Volume | Mint/redeem query | Dune transfers | Dune transfers | Public reports |

Every competitor column in the UI includes a "Source & Date" tooltip. If a competitor number is >30 days old, it renders in muted color with a staleness warning.

---

## 10. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Nexus contracts have minimal on-chain activity (early launch) | High | Mock data layer is pre-built; dashboard still demonstrates methodology even at $0 live TVL |
| Issuer identity not attributable on-chain | Medium | Manual address registry with documented assumptions — this is disclosed, not hidden |
| Dune query performance too slow for live dashboard | Medium | All queries cached at API route layer with 1hr TTL; loading skeletons for UX |
| Competitor data methodology differs from Nexus | Medium | Explicit methodology notes per column; flag comparisons as "approximate" where conventions differ |
| Cross-chain event matching is unreliable | Low-Medium | Report median settlement time with sample count; flag low-confidence chains |
| Dune free tier rate limits hit in production | Low | Cache aggressively; consider Dune API key upgrade or Supabase snapshot layer |

---

## 11. Success Metrics

This is a portfolio project, not a product. Success is measured differently:

| Signal | Target |
|---|---|
| GitHub stars within 30 days of launch | 10+ |
| Ondo team or ecosystem member engages publicly | 1 mention / retweet |
| Technical write-up reads | 200+ |
| Recruiter/firm references project in outreach response | 2+ instances |
| Dashboard loads to fully rendered state in < 3s | Performance baseline |
| Every metric has a documented source or mock label | 100% data integrity |

---

## 12. Open Questions

These must be resolved in Phase 0 before any code is written:

1. **Which chains is Nexus deployed on?** Ethereum mainnet confirmed? Mantle? Arbitrum? This determines RPC setup and cross-chain complexity.
2. **Are third-party issuers actually live on Nexus, or is it currently Ondo-native assets only?** If only Ondo-native, the TVL-by-issuer pillar collapses to a single bar chart.
3. **Does the Nexus contract emit a distinct event for external issuer mints vs. Ondo's own?** If not, issuer attribution is all manual.
4. **Is the redemption flow two-phase (request + settle) or atomic?** This determines whether settlement time delta is even computable from on-chain data.
5. **What is the Dune community's existing coverage of Ondo?** Fork and extend vs. build from scratch are completely different timelines.

---

## 13. Appendix

### A. Glossary
- **Nexus:** Ondo's cross-chain instant liquidity layer for third-party tokenized Treasury issuers
- **TVL:** Total Value Locked — USD value of assets currently deposited in Nexus contracts
- **Settlement Delta:** Time elapsed between a redemption request event and its corresponding settlement confirmation on-chain
- **Liquidity Depth:** Available liquidity for immediate redemption at a given point in time, by issuer and chain
- **SparkSQL:** Dune's SQL dialect, based on Apache Spark SQL

### B. Key References
- Ondo Finance Docs: docs.ondo.finance
- Ondo GitHub: github.com/ondoprotocol
- Dune Analytics: dune.com
- Dune API Docs: docs.dune.com/api-reference
- viem documentation: viem.sh
- Recharts: recharts.org

### C. Version History
| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial draft |
