# Ondo Nexus Dashboard — Development Log

This file is the living record of the build. Every session is logged.
Audience: project continuity, public proof-of-work, recruiter artifact.

---

## Log Format
Each entry follows this structure:

### [YYYY-MM-DD] — Session Title
**Phase:** Phase 0 / 1 / 2 / 3
**Duration:** ~Xhr
**Goal:** What this session set out to do

**Shipped**
- Concrete thing completed

**Attempted / Blocked**
- What didn't work and why

**Learned**
- Any new domain knowledge (contract structure, Dune quirks, etc.)

**Decisions Made**
- Any architecture or methodology decision (link to DECISIONS.md if significant)

**Next Session**
- Specific goal for next session

---

## Entries

### [2026-04-09] — Project Setup
**Phase:** Phase 0
**Duration:** ~1hr
**Goal:** Establish project structure, CLAUDE.md hierarchy, slash commands

**Shipped**
- Full folder structure created
- CLAUDE.md (root) written with token-optimized session workflow
- STATUS.md initialized as one-page snapshot
- Slash commands: log-session, update-status, log-decision
- PRD finalized (13 sections)
- Architecture Decision Records initialized (ADR-001, ADR-002)

**Attempted / Blocked**
- None

**Learned**
- Claude Code auto-memory writes to ~/.claude/projects/<project>/memory/
- Subdirectory CLAUDE.md files only load when Claude touches that directory
- STATUS.md indirection keeps root context under 60 lines

**Decisions Made**
- Dune over custom subgraph (see DECISIONS.md ADR-001)
- Mock data as first-class feature (see DECISIONS.md ADR-002)

**Next Session**
- Phase 0: Scrape docs.ondo.finance + github.com/ondoprotocol
- Goal: locate all Nexus contract addresses and confirm event schema

### [2026-04-09] — Contract Research & Phase 0 Completion
**Phase:** Phase 0
**Duration:** ~2hr
**Goal:** Answer all 5 PRD open questions, document contract addresses and event schemas

**Shipped**
- docs/CONTRACT_RESEARCH.md: complete address registry (OUSG, USDY, Bridge, GM across 10+ chains)
- docs/METHODOLOGY.md: data source taxonomy, per-pillar methodology, cross-chain strategy
- ADR-003: Nexus has no dedicated contracts — track OUSG/USDY InstantManager as proxy
- ADR-004: Pillar 2 pivot from settlement delta to volume/frequency (atomic redemptions)
- ADR-005: Ethereum-first data strategy (InstantManager on ETH, Transfers elsewhere)
- All 5 PRD open questions answered with on-chain evidence

**Attempted / Blocked**
- Non-EVM chains (Solana, Sui, Aptos) have no Dune coverage — must mock those cells in heatmap

**Learned**
- Ondo Nexus is NOT a separate contract system — it's a backing diversification of OUSG
- InstantManager redemptions are atomic (single tx) — no settlement delay exists on-chain
- OUSG/USDY InstantManagers are Ethereum-only; other chains are bridged via LayerZero OFT
- subscriberId in events is opaque KYC hash, not public issuer identity
- Dune has decoded `ondofinance` namespace — can query clean event tables
- Strong fork candidates: steakhouse/ondo-finance, lindyhan/ondo-usdy-ousg

**Decisions Made**
- Track OUSG/USDY as Nexus proxy (ADR-003)
- Volume/frequency metrics replace settlement delta for Pillar 2 (ADR-004)
- Ethereum-first with Transfer events on other EVM chains (ADR-005)

**Next Session**
- Phase 1: Scaffold Next.js 14 at repo root
- Define TypeScript types, build mockData.ts, write Dune SQL queries
- Build Dune API client with 1hr cache + mock fallback
