# Ondo Nexus Adoption Intelligence

[![CI](https://github.com/RahilBhavan/Ondo/actions/workflows/ci.yml/badge.svg)](https://github.com/RahilBhavan/Ondo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Live:** [ondo-nexus.vercel.app/flows](https://ondo-nexus.vercel.app/flows)

How much money moves through Ondo's instant mint and redeem for OUSG and USDY each week, from how many wallets, and is it growing?

This dashboard answers that from public on-chain data. It reads the `Subscription` and `Redemption` events of Ondo's OUSG and USDY InstantManager contracts on Ethereum from Blockscout's free logs API, buckets them by week, and charts mint volume, redeem volume, net flow, and unique wallets for each token.

## What it tracks

| Token | Contract (Ethereum) | Events |
|-------|---------------------|--------|
| OUSG | [`0x93358db73B6cd4b98D89c8F5f230E81a95c2643a`](https://etherscan.io/address/0x93358db73B6cd4b98D89c8F5f230E81a95c2643a) | `Subscription`, `Redemption` |
| OUSG (legacy, Apr 2024 to Apr 2025) | [`0x2826989983e3a66F0622132D019c2Ae173eb6A43`](https://etherscan.io/address/0x2826989983e3a66F0622132D019c2Ae173eb6A43) | `InstantMint[Rebasing]OUSG`, `InstantRedemption[Rebasing]OUSG` |
| USDY | [`0xa42613C243b67BF6194Ac327795b926B4b491f15`](https://etherscan.io/address/0xa42613C243b67BF6194Ac327795b926B4b491f15) | `Subscription`, `Redemption` |

It counts instant mints and redemptions only. Secondary transfers, DEX trades, and bridged balances on other chains are out of scope. Why Nexus maps to these contracts: [ADR-003](docs/DECISIONS.md). Full method: [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

Every number on the page carries a badge: **live** (read from its public source), **estimated**, or **mocked** (cited public disclosures in `src/lib/mockData.ts`).

## Run it

```bash
npm ci                       # no API keys needed
npm run dev                  # http://localhost:3000
```

## Layout

```
queries/        Metric definitions in Dune SQL (the app computes the flows from on-chain logs)
src/lib/        Data getters (event logs, chain supply, holders, benchmark), types, mock data
src/components/ Dashboard charts and UI atoms
src/app/api/    /api/metrics (aggregated)
docs/           Contract research, methodology, architecture decisions
```

## Working on it with Claude Code

The repo ships its own agent setup, so a fresh clone is ready to go:

- `.mcp.json` connects the [Dune MCP server](https://docs.dune.com/api-reference/agents/mcp) for ad hoc SQL (reads `DUNE_API_KEY` from your environment). The app itself does not use Dune.
- `.claude/agents/dune-analyst.md` writes, saves, and runs Dune SQL.
- `.claude/agents/onchain-verifier.md` spot-checks live totals against transactions on Etherscan.
- `.claude/skills/live-pillar` takes one pillar from mock to live data, end to end.
- `.claude/settings.json` turns on the TypeScript LSP, frontend-design, PR review, commit, security, and Playwright plugins.

## License

[MIT](LICENSE)
