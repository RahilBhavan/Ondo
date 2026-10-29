# Ondo flows dashboard: OUSG, USDY and stablecoin mints and redemptions from Ethereum logs

[![CI](https://github.com/RahilBhavan/Ondo/actions/workflows/ci.yml/badge.svg)](https://github.com/RahilBhavan/Ondo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Live:** [ondo-nexus.vercel.app](https://ondo-nexus.vercel.app)

![The /summary page: Fed rate cuts lined up with stronger USDC and USDT issuance and weaker BUIDL and OUSG issuance in 2024, but the 2025 easing episode only partly repeated the pattern](docs/img/summary.png)

A Next.js dashboard that decodes Ondo's OUSG and USDY InstantManager events on Ethereum and charts weekly mint volume, redeem volume, net flow and unique wallets. The `/issuance` page puts the same measurement on six assets from five issuers: USDC (Circle), USDT (Tether), PYUSD (PayPal), BUIDL (BlackRock) and OUSG and USDY (Ondo). It also shows where each stablecoin's supply sits by chain and how net issuance moved around the Fed's rate cuts. Every number on the page carries a **live**, **estimated** or **last good** badge. A last good value is a real earlier read, shown with its date. The dashboard shows no mocked numbers.

## Results

The figures in this section and the dates below come from the committed snapshots. `npm run sync:readme` rewrites them, and `npm test` fails if they drift. The bullet on the 2024 and 2025 rate-cut episodes is hand-written: reread it after every refresh.

<!--snapshot:results-->

From the dated snapshot in `src/data/issuance.json` (event logs read 2026-10-25 UTC, Ethereum only, weeks of 26 Dec 2022 through 12 Oct 2026):

| Asset | Mints | Redemptions | Net |
|-------|------:|------------:|----:|
| USDC | $420.5B | $444.2B | −$23.7B |
| USDT | $82.8B | $26.1B | $56.7B |
| PYUSD | $19.2B | $17.3B | $1.8B |
| BUIDL | $2.3B | $2.1B | $195.9M |
| OUSG | $1.3B | $748.5M | $598.5M |
| USDY | $250.1M | $68.8M | $181.3M |
| **Five issuers** | **$526.3B** | **$490.5B** | **$35.8B** |

<!--/snapshot-->

<!--snapshot:counts-->

- The snapshot holds 3,217,426 decoded event logs (the `audit` counts in `src/data/issuance.json`). USDC is 3.18M of them.
- The five issuers total about $1T of mints and redemptions: $1.02T after removing $192.1B of Circle CCTP transfers, $1.21T if they were counted (`grossUsd` and `grossWithCctpUsd` in `src/lib/issuance.ts`). The tracker excludes CCTP because moving USDC between chains is not new money. It also excludes Paxos's mistaken 300 trillion PYUSD mint and its burn on 2025-10-15.

<!--/snapshot-->

- In the 2024 easing episode (Sep to Dec 2024, 100 bp), USDC and USDT net issuance ran above their own norm (+0.5σ each), and BUIDL and OUSG ran below theirs (−0.2σ and −0.3σ). The 2025 episode (Sep to Dec 2025, 75 bp) only partly repeated it. With two episodes this is descriptive, not evidence of cause. `/summary` renders these figures from `src/lib/issuance.ts`.

<!--snapshot:reconcile-->

- Ethereum log-derived net issuance matched DefiLlama's Ethereum supply change within 18% for USDC and 8% for PYUSD (`src/lib/issuance.check.ts`, checked against the snapshot read <!--asof:flows-->2026-10-25<!--/asof-->).

<!--/snapshot-->

## How it works

- **Ondo flows (`/`, `/flows`).** `src/lib/flowEvents.ts` pages the InstantManager logs from Blockscout's keyless v2 API, decodes them with viem and groups them by Monday-UTC week. It reads three contracts: the current OUSG manager, the legacy OUSG manager (Apr 2024 to Apr 2025) and the USDY manager. Log pages older than a fixed block cache for a week. Newer pages refresh hourly. `queries/mint_redeem_volume.sql` holds the same definition in Dune SQL as a written reference.
- **Home page pillars.** `src/lib/chainSupply.ts` reads total supply on 13 chains and prices it with the Ethereum `OndoOracle`. `src/lib/topHolders.ts` reads Ethereum holders from Blockscout and Stellar USDY holders from stellar.expert. `src/lib/benchmark.ts` reads BUIDL from DefiLlama's stablecoin series and the Ondo row from the on-chain total; Superstate and OpenEden TVL have no free live source and stay labeled snapshots. When a source fails, each getter returns its last good rows from `src/data/last-good.json`, labeled **last good** with the date of the original read. A row with no stored value is left out. `scripts/snapshot-last-good.ts` refreshes that file from the live sources; `scripts/verify-supply.ts` compares the supply reads with independent explorers.
- **Stablecoin flows (`/issuance`, `/summary`).** `scripts/backfill-issuance.mjs` reads `eth_getLogs` from Tenderly's public mainnet gateway in 100,000-block windows. `scripts/backfill-context.mjs` adds DefiLlama supply by chain and the FRED `DFEDTARU` rate. Both scripts write `src/data/*.json`. The pages read these snapshots through `src/lib/issuance.ts`, not on each request.
- `/api/metrics` returns the same data as JSON.

## Run it

Prerequisites: Node.js 20 or later (CI uses 20) and npm. No API keys are needed. Every data source is public and keyless.

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run dev        # serves on port 3000; the deployed copy is ondo-nexus.vercel.app
```

`npm test` runs the self-check scripts in `src/lib/*.check.ts` with `tsx` (pinned in `package.json`). They work from the committed snapshots and need no network: each one is preloaded with `scripts/no-network.mjs`, which makes any `fetch`, DNS lookup or socket connection throw, so a check that reaches for the network fails. `issuance.check.ts` reconciles the committed snapshots and `readmeSync.check.ts` checks the README against them. CI runs lint, the type check, `npm test` and `npm run build`.

The snapshots refresh themselves. `.github/workflows/refresh-snapshots.yml` runs every Monday at 06:00 UTC (and on demand from the Actions tab). It reruns the backfill scripts and `scripts/snapshot-last-good.ts`, rewrites the README figures, runs the type check and `npm test`, and opens a pull request with the changed `src/data/*.json`. It needs no secrets: every source is public and keyless. Nothing merges by itself.

To refresh by hand (about 25 minutes on the free public RPC):

```bash
node scripts/backfill-issuance.mjs
node scripts/backfill-context.mjs
npx tsx scripts/snapshot-last-good.ts
npm run sync:readme
npm test
npx tsx docs/textbook/build.ts   # rebuild the study guide
```

The USDC share card (`docs/img/usdc-share-card.svg` and `.png`, 1024px wide, navy and red) is built from the same snapshot. On posting day run `npm run card:usdc-share:fresh`: it re-pulls the event logs, then renders the card with its data-as-of date. `npm run card:usdc-share` renders from the existing snapshot and refuses one that is not from today (`--allow-stale` overrides).

## Repository layout

```
src/app/          Pages (/, /flows, /issuance, /summary) and /api/metrics
src/components/   Dashboard charts, issuance figures and UI atoms
src/lib/          Data getters, types, last-good fallbacks and *.check.ts self-checks
src/data/         Dated snapshots: the stablecoin flows tracker and the last good values
scripts/          Backfill and snapshot scripts that write src/data/*.json, and the supply cross-check
queries/          Metric definitions in Dune SQL (reference; the app does not call Dune)
docs/             Methodology, contract research, decisions and the study guide
.claude/          Claude Code agents, commands and the live-pillar skill
```

`.mcp.json` connects the Dune MCP server for ad hoc SQL and reads `DUNE_API_KEY` from your environment. The app does not use it.

## Documentation

- [docs/METHODOLOGY.md](docs/METHODOLOGY.md): how each number is sourced, computed and labeled, pillar by pillar.
- [docs/CONTRACT_RESEARCH.md](docs/CONTRACT_RESEARCH.md): Ondo contract addresses, event schemas and why Ondo Nexus has no contracts of its own.
- [docs/DECISIONS.md](docs/DECISIONS.md): architecture decision records, from Dune to Blockscout logs to precomputed snapshots.
- [docs/BLOCKERS.md](docs/BLOCKERS.md): open blockers and how past ones were resolved.
- [docs/textbook/index.html](docs/textbook/index.html): a printable study guide to the stablecoin flows tracker, built from the same snapshots.

## Sources

- **Ondo flows.** InstantManager event logs from [Blockscout](https://eth.blockscout.com) (v2 API, keyless), read at render time and cached for one hour. Full history from Apr 2024 (OUSG) and Dec 2025 (USDY).
- **Chain supply and price.** public RPCs and chain APIs on 13 chains, priced with `OndoOracle` on Ethereum. The per-chain table is in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).
- **Holders.** Blockscout token holders API for Ethereum (OUSG, USDY) and the stellar.expert asset holders API for Stellar USDY.
- **Benchmark.** [DefiLlama](https://defillama.com) TVL per product, plus redemption terms quoted from each issuer's docs.
- **Stablecoin flows.** Ethereum event logs through Tenderly's public gateway, DefiLlama stablecoin supply and FRED `DFEDTARU`. The backfill scripts freeze these as dated JSON in `src/data/`: event logs with `asOf` <!--asof:flows-->2026-10-25<!--/asof-->, supply by chain <!--asof:supply-->2026-10-24<!--/asof-->, rates <!--asof:rates-->2026-10-24<!--/asof--> (UTC dates).
- **Last good values.** `src/data/last-good.json` holds real reads from the sources above, written on <!--asof:lastGood-->2026-10-26<!--/asof--> (Superstate USTB and OpenEden TBILL rows date from 2026-09-24).

## How this was built

<!-- DRAFT for Rahil to confirm or edit before this merges. Written by an AI agent from the git history, docs/DECISIONS.md, docs/METHODOLOGY.md and DEVLOG.md. Check who made which decision and what you checked yourself. -->

AI coding agents wrote much of the code and documentation. Claude Code is credited as co-author on most commits (20 of 30 when this section was written; `git log --grep "Co-authored-by: Claude" -i`), and `.claude/` holds the agents, commands and skill it ran with. Rahil Bhavan is the author of the project and its PRD, and owns what it claims.

What Rahil designed, as the repo records it:

- **The question and the scope.** The PRD sets the goal: an independent, on-chain view of Ondo Nexus adoption. The decision records in [docs/DECISIONS.md](docs/DECISIONS.md) fix the scope: OUSG and USDY InstantManager activity stands in for Nexus, which has no contracts of its own (ADR-003); volume and frequency replace a settlement delta that atomic redemptions make unmeasurable (ADR-004); Circle CCTP transfers and Paxos's mistaken 300 trillion PYUSD mint are not issuance (ADR-009).
- **The integrity rules.** Every metric carries a live, estimated or last good badge, and no number is invented: a failed read shows an earlier real read with its date, or nothing (ADR-010, `CLAUDE.md`).
- **The metric definitions** in [docs/METHODOLOGY.md](docs/METHODOLOGY.md) and the Dune SQL in `queries/`.

What was checked against an independent source, as the docs record it:

- The decoded weekly Ondo flows matched Dune query 8822192 on all 157 (week, token) rows through the week of 2026-09-14, to the cent on volume (ADR-008).
- Chain supply matched an independent explorer to the token on Ethereum USDY and OUSG, Mantle USDY and Plume USDY, and Stellar USDY matched stellar.expert within 0.000005% (`scripts/verify-supply.ts`, METHODOLOGY Pillar 3).
- Log-derived net issuance for USDC and PYUSD is reconciled against DefiLlama's Ethereum supply change in `src/lib/issuance.check.ts`.

What was not independently checked: supply on the other chains rests on each chain's own RPC or API (METHODOLOGY Pillar 3); the Superstate USTB and OpenEden TBILL rows are an old snapshot; and the textbook's reading list was written from memory and its citations still need verifying (DEVLOG, 2026-10-17).

## Scope and limits

- Independent project. It is not affiliated with or endorsed by Ondo Finance, Circle, Tether, PayPal, Paxos, BlackRock or Securitize.
- Ondo Nexus has no contracts of its own. The dashboard uses OUSG and USDY InstantManager activity as its on-chain proxy ([ADR-003](docs/DECISIONS.md)).
- It counts instant mints and redemptions only. Secondary transfers, DEX trades and bridged balances are out of scope.
- Gross flows are Ethereum only. Tron holds about half of USDT supply, so Ethereum logs understate USDT and USDC issuance. Net issuance for the three stablecoins uses all-chain supply instead.
- The stablecoin data are a dated snapshot (event logs read <!--asof:flows-->2026-10-25<!--/asof-->), not a live read. A weekly workflow proposes a refresh as a pull request, so the snapshot is as fresh as the last merged refresh.
- The rate-cut comparison covers two easing episodes, so it is descriptive only.
- On 2026-10-21, DefiLlama's `/tvl/<slug>` endpoint returned `0` for all four benchmark products. The USTB and TBILL rows therefore show their 2026-09-24 last good value, labeled **last good**.

## License

[MIT](LICENSE). The license covers this project's code, not third-party data from Blockscout, DefiLlama, FRED or the issuers.

Part of [Rahil Bhavan's projects](https://github.com/RahilBhavan).
