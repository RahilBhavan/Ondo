---
name: live-pillar
description: Take one dashboard pillar from mock data to live Dune data, end to end. Use when the user says "make pillar N live", "wire up <metric> to Dune", or picks up a `metric` issue.
---

# Live pillar

One pillar goes live at a time. Every other pillar stays on mock data with a `mocked` DataSourceBadge.

1. **Issue.** Read the GitHub issue (`gh issue view <n>`). Its done check is the acceptance test.
2. **Query.** Delegate to the `dune-analyst` agent: update the SQL in `/queries`, save it on Dune, and return the query id and columns. Put the id in `.env.example` as a named variable, never hardcoded.
3. **Data layer.** Delegate to `runner`: map Dune rows to types in `src/lib/types.ts`, fetch with `getLatestResults()` from `src/lib/dune.ts` in `/api/metrics`, and set `dataSource: 'live'`, `asOf`, and `source` on live rows. If Dune fails, fall back to mock data labeled `mocked`. Style anchor: `src/app/api/dune/[queryId]/route.ts`.
4. **UI.** Charts take data through props from `page.tsx` (see `src/components/CLAUDE.md`). Every number gets a DataSourceBadge.
5. **Methodology.** Add the contract addresses, event names, and what the metric excludes to `docs/METHODOLOGY.md` and the MethodologyDrawer.
6. **Verify.** Run `npm run lint && npx tsc --noEmit && npm run build`, then dispatch `reviewer` on the diff and `onchain-verifier` for the Etherscan spot check. Both must pass.
7. **Ship.** Open a PR that closes the issue and paste the verifier table into the body. Deploy only after the user confirms.
8. Run `/project:log-session`.
