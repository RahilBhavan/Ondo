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
- Design system: `DESIGN.md` (tokens in `src/app/globals.css`).

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
