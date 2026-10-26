# Nexus Dashboard — Current Status
Last updated: 2026-10-24

## Phase
[x] Phase 0 — Contract Research
[x] Phase 1 — Data Layer (weekly flows live from on-chain logs, ADR-008)
[x] Phase 2 — Frontend Build (home, /flows)
[x] Home page on real data, Phases 0-5 of #30 (merged)
[x] Stablecoin flows tracker: USDC, USDT, PYUSD, BUIDL + OUSG, USDY (ADR-009), `/issuance` and `/summary`
[x] Study textbook for the outreach (`docs/textbook/index.html`, rebuilt from the data snapshots)
[x] Deployed to Vercel (ondo-nexus.vercel.app, personal scope)
[x] Benchmark: BUIDL live from DefiLlama's stablecoin series (#54); USTB and TBILL stay labeled snapshots (no free source)
[x] Stablecoin snapshots rerun 2026-10-24

## Live Pages
- `/` — home: KPIs, top holders, chain breakdown, heatmap, 12-week flows, benchmark
- `/flows` — full weekly mint/redeem history
- `/issuance` — six assets: mints and redemptions, cumulative net issuance, Fed-cut comparison, chains, news events
- `/summary` — one A4 page with two charts (print to PDF from the browser)
- `/api/metrics` — JSON of the same data the home page renders, plus `issuance`

## Sources (ADR-007, ADR-008)
- Weekly flows + 4-week KPIs: InstantManager event logs from Blockscout, refreshed hourly (ADR-008)
- Total TVL, chain breakdown, heatmap: on-chain supply on 13 chains × OndoOracle price
- Top holders: Blockscout for Ethereum, stellar.expert for Stellar USDY
- Benchmark: BUIDL from DefiLlama's stablecoin series (circulating supply); Ondo row is the on-chain total; USTB and TBILL are the 2026-09-24 snapshot (DefiLlama's `/tvl` and `/protocol` return nothing for these RWA slugs; needs its keyed RWA API)
- Every getter falls back to its last good rows in `src/data/last-good.json` (real reads, labeled Last good with their date); `mockData.ts` is gone (ADR-010)

## Open Items
- After refreshing the snapshots, rebuild the textbook: `npx tsx docs/textbook/build.ts`.
- Flows tracker data are dated snapshots (last run 2026-10-24): rerun `node scripts/backfill-issuance.mjs` (about 25 min for the first pass; the dense USDC, PYUSD and BUIDL series take about 40 min at the 10k-block window and Tenderly's public gateway may 429, so rerun those with `node scripts/backfill-issuance.mjs USDC PYUSD BUIDL`) and `node scripts/backfill-context.mjs`, then `npx tsx src/lib/issuance.check.ts`.
- Flows tracker is Ethereum logs only; Tron USDT and non-Ethereum USDC issuance are covered through supply, not logs.
- BUIDL chain count and redemption terms: no issuer page to cite, shown as "Not disclosed".
- Rahil action: rotate the Dune API key (the app no longer uses Dune; only the MCP server does).

## Key Decisions
- Nexus has no contracts; track OUSG/USDY as proxy (ADR-003)
- Pillar 2: volume/frequency, not settlement delta (ADR-004)
- USDY raw-log decode, legacy OUSG included (ADR-006)
- Home page on on-chain supply, Blockscout and DefiLlama instead of Dune (ADR-007)
- Weekly flows from Blockscout logs instead of Dune; Dune removed from the app (ADR-008)
- Multi-issuer flows from precomputed log snapshots; CCTP and the PYUSD 300T mistake excluded (ADR-009)
