# Nexus Dashboard — Current Status
Last updated: 2026-10-29

## Phase
[x] Phase 0 — Contract Research
[x] Phase 1 — Data Layer (weekly flows live from on-chain logs, ADR-008)
[x] Phase 2 — Frontend Build (home, /flows)
[x] Home page on real data, Phases 0-5 of #30 (merged)
[x] Stablecoin flows tracker: USDC, USDT, PYUSD, BUIDL + OUSG, USDY (ADR-009), `/issuance` and `/summary`
[x] Study textbook for the outreach (`docs/textbook/index.html`, rebuilt from the data snapshots)
[x] Deployed to Vercel (ondo-nexus.vercel.app, personal scope)
[x] Benchmark: BUIDL live from DefiLlama's stablecoin series (#54); USTB and TBILL stay labeled snapshots (no free source)
[x] Stablecoin snapshots rerun 2026-10-25 (event logs), 2026-10-24 (supply, rates)
[x] Weekly `refresh-snapshots` workflow proposes snapshot refreshes as a pull request; `npm test` runs offline and checks the README against the snapshots

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
- Flows tracker data are dated snapshots (event logs read 2026-10-25). `.github/workflows/refresh-snapshots.yml` reruns the backfill scripts every Monday and opens a pull request; merge it after reading the hand-written README bullet on the rate cuts. By hand: `node scripts/backfill-issuance.mjs` (about 25 min; the dense USDC, PYUSD and BUIDL series can take 40 min and Tenderly's public gateway may 429), `node scripts/backfill-context.mjs`, `npm run sync:readme`, `npm test`, then `npx tsx docs/textbook/build.ts`.
- Rahil action: confirm or edit the README section "How this was built" (drafted by an agent from the history), and check Settings > Actions > General allows Actions to create pull requests.
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
