# Ondo Nexus Dashboard — Data Methodology

**Version:** 2.0
**Last Updated:** 2026-09-24

This document explains how every number on the dashboard is sourced, computed, and labeled. If a metric cannot be verified from on-chain data alone, this document explains why and what assumptions fill the gap.

---

## Data Source Taxonomy

Every data point on the dashboard carries one of three labels:

| Label | Meaning | Criteria |
|-------|---------|----------|
| **Live** | Read from its source on this render: on-chain RPC, Blockscout, or DefiLlama | No manual assumptions, independently verifiable. Cached up to 1hr |
| **Estimated** | A total that mixes live and mocked rows | Shown when some but not all rows behind a number are live |
| **Mocked** | Dated snapshot or illustrative value, shown when the source fails | Carries its own source and asOf; prefixed with "~" |

The `DataSourceBadge` component renders this label inline with every metric. The methodology drawer explains each gap.

---

## Pillar 1: Top Ethereum Holders

**What we track:** The top 15 holders of OUSG and USDY on Ethereum, with balance and USD value. Code: `src/lib/topHolders.ts`.

**Data source:** Blockscout token holders API, no key needed:
`https://eth.blockscout.com/api/v2/tokens/<token>/holders` for OUSG (`0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92`) and USDY (`0x96F6eF951840721AdBF46Ac996b59E0235CB985C`). Balances are 18-decimal integers.

**USD value:** balance × `OndoOracle.getAssetPrice(token)` on Ethereum (`0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094`, 1e18-scaled).

**Names:** First the manual registry in `addressRegistry.ts`, then the highest-ordinal Blockscout public tag of type `name`. Generic tags, ordinal-0 tags, tags equal to the contract name (such as `CErc20DelegatorKYC`) and `GnosisSafeProxy*` tags are ignored, since they name a contract class, not an owner. Anything else shows as "Unknown wallet (0x...)".

**Data source label:** **Live** when both holder calls and the oracle read succeed. Otherwise **Mocked**: a Blockscout snapshot from 2026-09-24 in `mockData.ts`.

**Known gaps:**
- Ethereum only. Holders on other chains are not listed.
- Contract holders (lending markets, Safes, bridges) hold on behalf of others; the dashboard does not look through them.
- OUSG's backing composition (which third-party assets) is not on-chain.

---

## Pillar 2: Mint/Redemption Volume & Frequency

**What we track:** Weekly USD volume, transaction counts, and unique wallets for instant mints and redemptions of OUSG and USDY, over full history. Served on the `/flows` page and in `weeklyFlows` of `/api/metrics`.

**Contracts (Ethereum):**
- OUSG InstantManager: [`0x93358db73B6cd4b98D89c8F5f230E81a95c2643a`](https://etherscan.io/address/0x93358db73B6cd4b98D89c8F5f230E81a95c2643a)
- OUSG InstantManager (legacy, Apr 2024 to Apr 2025): [`0x2826989983e3a66F0622132D019c2Ae173eb6A43`](https://etherscan.io/address/0x2826989983e3a66F0622132D019c2Ae173eb6A43)
- USDY InstantManager: [`0xa42613C243b67BF6194Ac327795b926B4b491f15`](https://etherscan.io/address/0xa42613C243b67BF6194Ac327795b926B4b491f15)

**Events:** `Subscription` (mint) and `Redemption` (redeem). USD value is `depositUSDValue` / `redemptionUSDValue`, 1e18-scaled and emitted by the contract, so no price oracle is needed.

**Legacy OUSG:** The legacy contract emits `InstantMint[Rebasing]OUSG` and `InstantRedemption[Rebasing]OUSG`. USD value is the USDC amount in or out (1e6), with USDC taken at $1. The wallet is `sender`.

**USDY:** The USDY InstantManager emits the same `Subscription` / `Redemption` events as the OUSG contract (topic1 = wallet, data word 4 = USD value). USDY history starts Dec 2025, when this contract went live. See ADR-006.

**Week:** Monday 00:00 UTC of the block time (the SQL's `DATE_TRUNC('week')`). The current week is partial; headline figures use the last complete week. Weeks with no events are shown as zero.

**Wallets:** Distinct `subscriber` / `redeemer` addresses. `unique_wallets` counts an address once per week across both sides, so it is not minters + redeemers. The `subscriberId` / `redeemerId` KYC ids are not used.

**Scope:** Instant mint and redeem only. Not secondary transfers, DEX trades, bridged balances, or other chains (ADR-005).

**Source:** event logs from Blockscout's keyless v2 logs API (`/api/v2/addresses/<contract>/logs?topic=<topic0>`, one series per contract and event), decoded with viem and grouped by week in `src/lib/flowEvents.ts` (ADR-008). The definition is written out in SQL in `queries/mint_redeem_volume.sql`, saved on Dune as [query 8822192](https://dune.com/queries/8822192); the app no longer calls Dune. The on-chain rows matched every Dune row through the week of 2026-09-14. Output: `week, token, mint_volume_usd, redeem_volume_usd, net_flow_usd, mint_count, redeem_count, unique_minters, unique_redeemers, unique_wallets`.

**Data source label:** **Live** when every log read succeeds and returns events. Otherwise **Mocked**: an illustrative series shaped from public disclosures, with a server log line giving the reason. `asOf` is when the logs were read; the home page shows it as "as of <date>" on the flows section and the net flow KPI.

**Home page KPIs:** 4-week volume, net flow and average transaction size sum the last 4 complete weeks of both tokens. The trend compares volume to the 4 complete weeks before; a change that rounds to 0.0% is shown as flat.

**Design note (PRD deviation):** The PRD originally specified settlement time delta (time between redemption request and settlement). Research found that InstantManager redemptions are **atomic**: they execute in a single transaction with zero settlement delay. There is no `RedemptionRequested`/`RedemptionSettled` event pair to measure.

Pillar 2 was redesigned to track **volume and frequency metrics**:
- Weekly mint volume (USD)
- Weekly redeem volume (USD)
- Net flow (mint - redeem) as adoption signal
- Weekly transaction count (mint + redeem separately)
- Weekly unique wallets (minters, redeemers, and either side)
- Growth: total volume of the last 12 complete weeks vs the 12 before

See ADR-004 in DECISIONS.md.

---

## Pillar 3: Total TVL, Chain Breakdown and Heatmap

**What we track:** OUSG and USDY TVL per (token, chain) across 13 chains. The Total TVL KPI, the chain breakdown and the heatmap all use these same rows. Code: `src/lib/chainSupply.ts`.

**Method:** TVL = total supply on the chain × the Ethereum `OndoOracle.getAssetPrice(token)` (`0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094`). Every chain shares this one price (the Mantle and BNB oracles return the same USDY value). Bridges are LayerZero OFT burn/mint, so each chain's supply is its own float and there is no lockbox to subtract. rUSDY, rOUSG and mUSD wrap tokens already counted and are left out. All reads run in parallel with an 8s timeout and a 1hr in-memory cache.

**Per-chain sources:**

| Token | Chain | Address / asset id | Read method |
|-------|-------|--------------------|-------------|
| USDY | Ethereum | `0x96F6eF951840721AdBF46Ac996b59E0235CB985C` | ERC-20 `totalSupply()` (18 decimals) |
| OUSG | Ethereum | `0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92` | ERC-20 `totalSupply()` |
| USDY | Mantle | `0x5bE26527e817998A7206475496fDE1E68957c5A6` | ERC-20 `totalSupply()` |
| USDY | Arbitrum | `0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D` | ERC-20 `totalSupply()` |
| OUSG | Polygon | `0xbA11C5effA33c4D6F8f593CFA394241CfE925811` | ERC-20 `totalSupply()` |
| USDY | Solana | `A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6` | RPC `getTokenSupply` |
| OUSG | Solana | `i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc` | RPC `getTokenSupply` |
| USDY | Sui | `0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY` | GraphQL `coinMetadata.supply` |
| USDY | Aptos | `0xcfea864b32833f157f042618bd845145256b1bf4c0da34a7013b76e42daa53cc::usdy::USDY` | View `0x1::coin::supply` (6 decimals) |
| USDY | Noble | `ausdy` | Cosmos bank `supply/by_denom` (18 decimals) |
| USDY | Stellar | `USDY-GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6` | Horizon `/assets`: sum of all `balances.*`, contracts, liquidity pools and claimable balances |
| USDY | Plume | `0xD2B65e851Be3d80D3c2ce795eB2E78f16cB088b2` | ERC-20 `totalSupply()` |
| USDY | Sei | `0x54cD901491AeF397084453F4372B93c33260e2A6` | ERC-20 `totalSupply()` |
| USDY | BNB Chain | `0x608593d17A2decBbc4399e4185bE4922F97eD32E` | ERC-20 `totalSupply()` |
| OUSG | XRP Ledger | `4F55534700000000000000000000000000000000.rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p` | `gateway_balances` obligations on the issuer |

**Data source label:** Per row. **Live** when both the supply read and the oracle read succeed. A failed supply read shows that row's 2026-09-24 snapshot as **Mocked**; a failed oracle read makes every row Mocked. The Total TVL KPI is **Estimated** when rows are mixed.

**Known gaps:**
- Supply counts every token in circulation, including any inventory Ondo itself holds (treasury, bridge or market-making wallets).
- BNB Chain and the XRP Ledger are included; DefiLlama's `ondo-yield-assets` does not count them, so our total runs higher.
- One Ethereum price for all chains. If a chain's token ever traded off the oracle price, this would not show it.

---

## Pillar 4: Competitive Benchmark

**What we track:** TVL, chain count and redemption terms for Ondo (OUSG + USDY), Invesco USTB on Superstate, OpenEden TBILL and BlackRock BUIDL. Code: `src/lib/benchmark.ts`.

**TVL:** DefiLlama `GET https://api.llama.fi/tvl/<slug>` per product (slugs `invesco-ustb`, `openeden-tbill`, `blackrock-buidl`, `ondo-yield-assets`), cached 1hr. The Ondo row is replaced by the Pillar 3 on-chain total when every chain row is live, so it equals the Total TVL KPI; otherwise it keeps DefiLlama. A table footnote says which source the Ondo row uses.

**Chain count and redemption:** Static text quoted from each issuer's own docs, with a link. DefiLlama's `chains` for these slugs is a placeholder, so it is not used. BUIDL shows "Not disclosed" for both: no issuer page could be cited.

**Data source label:** Per row. **Live** when the fetch (or on-chain total) succeeds, else the 2026-09-24 DefiLlama snapshot as **Mocked**.

**Known gaps:**
- Accounting may differ between products (accrued yield, which chains count).
- Ondo's on-chain total and competitors' DefiLlama totals use different methods; the footnote says so.
- Redemption terms are not comparable one to one; products have different designs.

---

## Cross-Chain Data Strategy

InstantManager contracts (mint/redeem events) exist **only on Ethereum**. All other chains have bridged tokens via LayerZero OFT adapters.

| Data Type | Source | Chains |
|-----------|--------|--------|
| Mint/Redeem events | Blockscout logs API, InstantManager events | Ethereum only |
| Supply / TVL | Direct RPC and API reads (table above) | All 13 chains |
| Top holders | Blockscout | Ethereum only |
| Competitor TVL | DefiLlama | As DefiLlama counts them |

---

## Caching Strategy

Each source is cached for 1 hour: chain supply and the oracle price in memory, Blockscout and DefiLlama in the Next fetch cache. Flow log pages at or below a fixed past block (`HISTORY_END_BLOCK`) start from a fixed cursor and never change, so they cache for a week; only the pages newer than that block refresh hourly. A cold load is about 51 calls and 12 seconds; a warm one is 5 calls. The home page and `/flows` re-render hourly (ISR). Chain supply caches only a fully live read, so a partial failure retries on the next render.

---

## Sources

All data sources are cited inline in the dashboard via the `MethodologyDrawer` component and each row's badge link. Primary sources:
- On-chain reads: public RPCs and chain APIs listed in Pillar 3
- OndoOracle on Ethereum for prices
- Blockscout (eth.blockscout.com) for Ethereum holders and InstantManager event logs (mint and redeem flows)
- DefiLlama (api.llama.fi) for competitor TVL
- Ondo Finance official documentation (docs.ondo.finance) and competitor docs
