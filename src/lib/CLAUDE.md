# Data Layer Conventions

## Types
- All data shapes defined in `types.ts` — import from there, never inline types
- Every data object extends `Sourced` (dataSource, asOf, source fields)
- `DataSource` is always one of: `'live' | 'estimated' | 'mocked'`

## Mock Data
- All mocks in `mockData.ts` — never scatter mock values across components
- Every mocked value has `source` (citation string) and `asOf` (ISO date)
- Realistic ranges from Ondo public disclosures, not round numbers
- `getMockPillarData(n)` returns typed data for pillar 1-4

## Dune Client
- `dune.ts` handles execute → poll → cache cycle
- 1hr in-memory cache TTL — no external cache needed for v1
- Falls back gracefully when DUNE_API_KEY is missing
- Use `getLatestResults()` for reads, `executeDuneQuery()` only when fresh data needed

## Address Registry
- `addressRegistry.ts` maps checksummed addresses to institution names
- `resolveAddress()` returns name or truncated address for unknowns
- `isProtocolAddress()` filters out Ondo infrastructure from TVL calculations
