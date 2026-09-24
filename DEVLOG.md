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

### [2026-09-24] — Home Page on Real Data (Phases 0-5, #30)
**Phase:** Phase 3
**Duration:** ~1 day
**Goal:** Replace every mocked number on the home page with a live source and put `/` back as the landing page

**Shipped**
- Weekly flow KPIs from Dune (query 8822192), with the Dune run date shown on the page
- Total TVL, chain breakdown and heatmap from total supply on 13 chains × OndoOracle price
- Top Ethereum holders from Blockscout, valued at the oracle price
- Benchmark TVL from DefiLlama; the Ondo row uses the on-chain total so it matches Total TVL
- `/api/metrics` serves the same data from the same getters
- Removed the `/` to `/flows` redirect and unused mock types and helpers
- Methodology drawer, METHODOLOGY.md, CONTRACT_RESEARCH.md and ADR-007 rewritten to match

**Attempted / Blocked**
- The Dune account hit its datapoint limit and cannot re-execute; flows show the last saved run

**Learned**
- Blockscout name tags include contract class names (CErc20DelegatorKYC, GnosisSafeProxy); ordinal-0 tags and tags equal to the contract name are not owner labels
- DefiLlama's Ondo total leaves out BNB and XRPL, so on-chain supply runs about 1% higher

**Decisions Made**
- Home page sources: on-chain supply, Blockscout, DefiLlama instead of Dune (ADR-007)

**Next Session**
- Merge the phase5-finish PR, deploy to Vercel (personal scope), rotate the Dune key

### [2026-09-24] — Weekly Flows from On-Chain Logs, Dune Removed
**Phase:** Phase 3
**Duration:** ~3hr
**Goal:** Stop depending on Dune, whose free datapoint limit froze the weekly flows at 2026-09-23

**Shipped**
- `src/lib/flowEvents.ts`: InstantManager logs from Blockscout's keyless v2 logs API, decoded with viem, grouped by week with the same rules as `queries/mint_redeem_volume.sql`
- Removed `dune.ts`, `/api/dune/[queryId]`, the Dune types and env vars; Dune text removed from the UI
- `flowEvents.check.ts`: decodes real logs for each event type and checks wallet dedupe across mint and redeem
- ADR-008, METHODOLOGY Pillar 2, README and STATUS updated

**Attempted / Blocked**
- Blockscout's Etherscan-style `/api` getLogs: keyless, it allows about 10 calls, then blocks the IP for 30 to 60 minutes
- Routescan's Etherscan-style API: its address filter drops some legacy OUSG logs (5 events in the week of 2024-09-23)

**Learned**
- Blockscout v2 logs pages run newest first; a hand-made cursor (`block_number`, `index`) returns the logs older than it, so pages from a fixed past block have stable URLs and can cache for a long time
- All 157 Dune rows through the week of 2026-09-14 match the on-chain rows exactly

**Decisions Made**
- Weekly flows from Blockscout logs instead of Dune (ADR-008)

**Next Session**
- Deploy to Vercel (personal scope) and watch the first cold render's Blockscout call count
