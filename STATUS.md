# Nexus Dashboard — Current Status
Last updated: 2026-04-09

## Phase
[x] Phase 0 — Contract Research (complete)
[ ] Phase 1 — Data Layer (in progress)
[ ] Phase 2 — Frontend Build
[ ] Phase 3 — Polish & Deploy

## What's Shipped
- PRD finalized (13 sections)
- Project infrastructure: CLAUDE.md, STATUS.md, DEVLOG.md, slash commands
- Contract research complete: all addresses, event schemas, 5 open questions answered
- METHODOLOGY.md: data source taxonomy, per-pillar methodology, cross-chain strategy
- ADRs 001-005: Dune, mock data, Nexus proxy, Pillar 2 pivot, Ethereum-first

## What's In Progress
- Phase 1: Next.js scaffold, types, mock data, Dune queries, API client

## Active Blockers
- None

## Next Session Goal
- Scaffold Next.js 14 project at repo root
- Define TypeScript types from contract research
- Build mockData.ts with source citations
- Write 4 Dune SQL queries
- Build Dune API client with caching

## Key Decisions Made
- Nexus has no contracts — track OUSG/USDY InstantManager as proxy (ADR-003)
- Pillar 2: volume/frequency metrics, not settlement delta (ADR-004)
- Ethereum-first: InstantManager events on ETH, Transfers on other chains (ADR-005)
