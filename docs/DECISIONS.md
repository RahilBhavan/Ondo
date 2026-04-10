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
