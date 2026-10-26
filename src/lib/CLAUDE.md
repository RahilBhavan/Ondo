# Data Layer Conventions

## Types
- All data shapes defined in `types.ts` — import from there, never inline types
- Every data object extends `Sourced` (dataSource, asOf, source fields)
- `DataSource` is always one of: `'live' | 'estimated' | 'cached'`

## Last Good Values
- No mock data. A failed read falls back to `src/data/last-good.json` (via `lastGood.ts`), labeled `cached`, keeping the original `asOf`
- Only `scripts/snapshot-last-good.ts` writes that file, and only from rows that came back live. Never hand-edit a number into it
- A getter with no stored row returns no row; the page says the value is unavailable

## Flow Events
- `flowEvents.ts` reads InstantManager logs from Blockscout's v2 address logs API (no key), decodes them with viem, and groups them by week
- Same definition as `queries/mint_redeem_volume.sql`; keep the two in sync
- Pages at or below `HISTORY_END_BLOCK` cache for a week, newer pages for 1hr
- Do not switch to Blockscout's Etherscan-style `/api?module=logs`: keyless, it allows about 10 calls, then blocks the IP for up to an hour. The v2 API allows 180 calls a minute
- Routescan's Etherscan-style API is not a substitute: its address filter drops some legacy OUSG logs (ADR-008)

## Address Registry
- `addressRegistry.ts` maps checksummed addresses to institution names
- `resolveAddress()` returns name or truncated address for unknowns
- `isProtocolAddress()` filters out Ondo infrastructure from TVL calculations
