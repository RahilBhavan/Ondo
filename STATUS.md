# Nexus Dashboard — Current Status
Last updated: 2026-09-24

## Phase
[x] Phase 0 — Contract Research
[x] Phase 1 — Data Layer (weekly flows live from on-chain logs, ADR-008)
[x] Phase 2 — Frontend Build (home, /flows)
[x] Home page on real data, Phases 0-5 of #30 (PR from phase5-finish, awaiting merge)
[ ] Deploy the merged home page to Vercel (personal scope)

## Live Pages
- `/` — home: KPIs, top holders, chain breakdown, heatmap, 12-week flows, benchmark
- `/flows` — full weekly mint/redeem history
- `/api/metrics` — JSON of the same data the home page renders

## Sources (ADR-007, ADR-008)
- Weekly flows + 4-week KPIs: InstantManager event logs from Blockscout, refreshed hourly (ADR-008)
- Total TVL, chain breakdown, heatmap: on-chain supply on 13 chains × OndoOracle price
- Top holders: Blockscout, Ethereum only
- Benchmark: DefiLlama; Ondo row uses the on-chain total when all chains are live
- Every getter falls back to a dated, labeled snapshot in `src/lib/mockData.ts`

## Open Items
- BUIDL chain count and redemption terms: no issuer page to cite, shown as "Not disclosed".
- Dune API key rotation pending (the app no longer uses Dune; only the MCP server does).

## Key Decisions
- Nexus has no contracts; track OUSG/USDY as proxy (ADR-003)
- Pillar 2: volume/frequency, not settlement delta (ADR-004)
- USDY raw-log decode, legacy OUSG included (ADR-006)
- Home page on on-chain supply, Blockscout and DefiLlama instead of Dune (ADR-007)
- Weekly flows from Blockscout logs instead of Dune; Dune removed from the app (ADR-008)
