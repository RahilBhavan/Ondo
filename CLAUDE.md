# Ondo Nexus Adoption Intelligence Dashboard

## Project
Open-source analytics dashboard for Ondo Nexus institutional adoption.
Portfolio project. Solo. Stack: Next.js 14, TypeScript, Tailwind, Recharts, Dune API.

## Start Every Session
1. Read @STATUS.md — current phase, active blockers, next goal
2. If writing data logic: read @src/lib/CLAUDE.md
3. If writing components: read @src/components/CLAUDE.md
4. If writing Dune SQL: read @docs/CONTRACT_RESEARCH.md and the file in /queries, or delegate to the `dune-analyst` agent

## End Every Session
Run /project:log-session — writes DEVLOG entry + updates STATUS.md automatically.

## Non-Negotiables
- Every metric needs a DataSourceBadge: live | estimated | mocked
- Mock data lives only in /src/lib/mockData.ts with source + asOf date
- No PDF generation — deferred to v2
- No purple gradients. Dark terminal aesthetic.

## Structure
- /queries     — Dune SQL source of truth
- /docs        — RAG context, reference with @docs/filename.md
- /src/lib     — data layer (dune.ts, types.ts, mockData.ts, addressRegistry.ts)
- /src/components — UI (see subdirectory CLAUDE.md)

## Tooling
- Dune MCP server in `.mcp.json` (needs `DUNE_API_KEY` in env)
- Agents: `dune-analyst` (SQL + Dune), `onchain-verifier` (Etherscan spot check, read-only)
- Skill: `live-pillar`, the mock-to-live flow for one pillar
- Work is tracked as GitHub issues; the PR template holds the merge checklist

## Key Docs
- PRD: @Ondo Nexus Adoption Intelligence.md
- Methodology: @docs/METHODOLOGY.md
- Contract findings: @docs/CONTRACT_RESEARCH.md
- Architecture decisions: @docs/DECISIONS.md
- Build log: @DEVLOG.md

## Current Project Status
See @STATUS.md before starting any task.
