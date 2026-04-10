# Ondo Nexus — Contract Research Findings

**Date:** 2026-04-09
**Status:** Complete
**Researcher:** Rahil Bhavan (via on-chain research + official docs)

---

## Key Finding: Nexus Has No Dedicated Contracts

Ondo Nexus is **not a separate smart contract deployment**. It is a business/technology initiative (announced February 2025) that diversifies OUSG's backing to include tokenized Treasuries from third-party asset managers:

- **BlackRock** (BUIDL)
- **Franklin Templeton**
- **WisdomTree**
- **Wellington Management**
- **Fundbridge Capital**

Nexus leverages the existing OUSG instant mint/redeem infrastructure. All on-chain activity flows through the OUSG and USDY InstantManager contracts on Ethereum.

**Dashboard implication:** Track OUSG + USDY InstantManager events as the on-chain proxy for Nexus activity.

---

## Contract Address Registry

### OUSG (Tokenized US Treasuries — Qualified Access)

#### Ethereum
| Contract | Address | Notes |
|----------|---------|-------|
| OUSG Token | `0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92` | EIP-1967 Transparent Proxy |
| OUSG InstantManager | `0x93358db73B6cd4b98D89c8F5f230E81a95c2643a` | Current mint/redeem hub |
| OUSG InstantManager (legacy) | `0x2826989983e3a66F0622132D019c2Ae173eb6A43` | Deprecated April 2025 |
| OndoIDRegistry | `0xcf6958D69d535FD03BD6Df3F4fe6CDcd127D97df` | KYC registry |
| OndoOracle | `0x9Cad45a8BF0Ed41Ff33074449B357C7a1fAb4094` | OUSG price oracle |
| Coinbase Prime (ousg.eth) | `0xF67416a2C49f6A46FEe1c47681C5a3832cf8856c` | Custodian |
| OUSG Recipient | `0x72Be8C14B7564f7a61ba2f6B7E50D18DC1D4B63D` | |
| PYUSD Recipient | `0x0317a350b093F8010837d1b844292555d73ebC2c` | |

#### Polygon
| Contract | Address |
|----------|---------|
| OUSG Token | `0xbA11C5effA33c4D6F8f593CFA394241CfE925811` |
| CashManager | `0x6B7443808ACFCD48f1DE212C2557462fA86Ee945` |
| Registry | `0x7cD852c0D7613aA869e632929560f310D4059AC1` |

#### Solana
`i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc`

#### XRP Ledger
`4F55534700000000000000000000000000000000.rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p`

### USDY (Yield-Bearing Stablecoin — General Access)

#### Ethereum
| Contract | Address | Notes |
|----------|---------|-------|
| USDY Token | `0x96F6eF951840721AdBF46Ac996b59E0235CB985C` | |
| rUSDY (rebasing) | `0xaf37c1167910ebC994e266949387d2c7C326b879` | |
| USDYc | `0xe86845788d6e3e5c2393ade1a051ae617d974c09` | |
| USDY InstantManager | `0xa42613C243b67BF6194Ac327795b926B4b491f15` | Mint/redeem hub |
| Coinbase Prime | `0xbDa73A0F13958ee444e0782E1768aB4B76EdaE28` | Custodian |
| Redemption Price Oracle | `0xA0219AA5B31e65Bc920B5b6DFb8EdF0988121De0` | |
| Blocklist | `0xd8c8174691d936E2C80114EC449037b13421B0a8` | |

#### Multi-Chain
| Chain | Token | Address |
|-------|-------|---------|
| Mantle | USDY | `0x5bE26527e817998A7206475496fDE1E68957c5A6` |
| Mantle | mUSD (rebasing) | `0xab575258d37EaA5C8956EfABe71F4eE8F6397cF3` |
| Arbitrum | USDY | `0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D` |
| Solana | USDY | `A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6` |
| Sui | USDY | `0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY` |
| Aptos | USDY | `0xcfea864b32833f157f042618bd845145256b1bf4c0da34a7013b76e42daa53cc::usdy::USDY` |
| Noble | USDY | `ausdy` |
| Stellar | USDY | `USDY-GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6` |
| Plume | USDY | `0xD2B65e851Be3d80D3c2ce795eB2E78f16cB088b2` |
| Sei | USDY | `0x54cD901491AeF397084453F4372B93c33260e2A6` |

### Ondo Bridge (LayerZero OFT Adapters)
| Chain | Address |
|-------|---------|
| Ethereum | `0xa6275720b3fB1Efe3E6EF2b5BF2293148852307D` |
| Mantle | `0x0bE393DC46248E4285dc5CAcA3084bc7e9bfbB41` |
| Arbitrum | `0x0bE393DC46248E4285dc5CAcA3084bc7e9bfbB41` |
| Solana | `7YNReenG6AXgVUfmSizt6hoVXrznS4zDdgCj1UTLJ2S3` |

### Ondo Global Markets (Not Nexus — separate product)
| Contract | Chain | Address |
|----------|-------|---------|
| GMTokenManager | Ethereum | `0x2c158BC456e027b2AfFCCadF1BDBD9f5fC4c5C8c` |
| USDon | Ethereum | `0xAcE8E719899F6E91831B18AE746C9A965c2119F1` |
| GMTokenManager | BNB | `0x91f8Aff3738825e8eB16FC6f6b1A7A4647bDB299` |

### ONDO Governance Token
Ethereum: `0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3`

---

## Event Schemas

### OUSG InstantManager (`0x93358db7...`)

**Subscription (Mint):**
```
Subscription(
  indexed address subscriber,
  indexed bytes32 subscriberId,  // opaque KYC hash — NOT public issuer identity
  uint256 rwaAmount,
  address depositToken,
  uint256 depositAmount,
  uint256 depositUSDValue,
  uint256 fee
)

InstantSubscriptionRebasingOUSG(
  indexed address recipient,
  uint256 ousgAmountOut,
  uint256 rousgAmountOut,
  address depositToken,
  uint256 depositAmount
)
```

**Redemption:**
```
Redemption(
  indexed address redeemer,
  indexed bytes32 redeemerId,  // opaque KYC hash
  uint256 rwaAmount,
  address receivingToken,
  uint256 receiveTokenAmount,
  uint256 redemptionUSDValue,
  uint256 fee
)

InstantRedemptionRebasingOUSG(
  indexed address redeemer,
  uint256 ousgAmountIn,
  uint256 rousgAmountIn,
  address receivingToken,
  uint256 receiveTokenAmount
)
```

### USDY InstantManager (`0xa42613C2...`)
Same event pattern with USDY/rUSDY field names instead of OUSG/rOUSG.

### Legacy OUSG InstantManager (`0x28269899...` — deprecated)
```
InstantMintOUSG(indexed address user, uint256 usdcAmount, uint256 ousgAmount)
InstantRedemptionOUSG(indexed address user, uint256 ousgAmount, uint256 usdcAmount)
```

---

## Answers to PRD Open Questions

### Q1: Which chains is Nexus deployed on?
Nexus operates through OUSG (Ethereum, Polygon, Solana, XRP Ledger) and USDY (Ethereum + 9 other chains). **InstantManager contracts (where mint/redeem events live) are Ethereum-only.** Other chains have bridged token contracts via LayerZero OFT adapters.

### Q2: Are third-party issuers live on Nexus?
Nexus works by diversifying OUSG's *backing* — third-party assets (Franklin Templeton, WisdomTree, Wellington, Fundbridge) are included in OUSG's collateral basket. There are no separate issuer contracts. Third-party issuers are NOT identifiable from on-chain events.

### Q3: Does the contract emit issuer identity in events?
**No.** The `subscriberId` field is an opaque bytes32 KYC hash internal to Ondo. The `address subscriber` identifies the wallet, not the institution. Issuer attribution requires a **manual address registry** as the PRD anticipated.

### Q4: Is the redemption flow two-phase or atomic?
**Atomic (instant).** Both mint and redeem execute in a single transaction via InstantManager. There is no `RedemptionRequested`/`RedemptionSettled` pattern. Settlement time delta is not computable from on-chain data.

Note: A non-instant redemption path exists (T+1/T+2 settlement, min $50K) but uses legacy CashManager contracts with different event signatures and much lower volume.

### Q5: What is the Dune community's existing coverage?
Strong coverage:
- `ondofinance` namespace is decoded on Dune
- **steakhouse/ondo-finance** — high-quality, from respected analytics team
- **lindyhan/ondo-usdy-ousg** — comprehensive USDY/OUSG supply + holder analysis
- **steakhouse/tokenized-securities** — competitive benchmark data (Pillar 4 fork candidate)
- **hashed_official/usdy** — USDY-focused

Needs verification: whether InstantManager contracts specifically are in decoded tables (vs. just token contracts).

---

## Data Availability Assessment

| Pillar | Data Available | Source | Gaps |
|--------|---------------|--------|------|
| 1: TVL by Issuer | Token balances per address | Dune Transfer events | Issuer identity is manual mapping only |
| 2: Mint/Redeem Velocity | Full event logs with USD values | Dune InstantManager events | No settlement delta (atomic); volume + frequency only |
| 3: Liquidity Heatmap | USDY balances per chain | Dune multi-chain Transfer events | Some chains may lack Dune coverage (Sui, Aptos) — mock those |
| 4: Competitive Benchmark | Partial — varies by competitor | Dune + public disclosures | Franklin Templeton data may be stale; methodology notes required |

---

## Sources
- [Ondo Finance Docs — Addresses](https://docs.ondo.finance/addresses)
- [Ondo Finance Docs — OUSG Redeeming](https://docs.ondo.finance/qualified-access-products/ousg/redeeming)
- [Ondo Finance Docs — Instant Limits](https://docs.ondo.finance/qualified-access-products/ousg/instant-limits)
- [Introducing Ondo Nexus (Blog)](https://ondo.finance/blog/introducing-ondo-nexus)
- [GitHub: ondoprotocol/usdy](https://github.com/ondoprotocol/usdy)
- [Dune: steakhouse/ondo-finance](https://dune.com/steakhouse/ondo-finance)
- [Dune: lindyhan/ondo-usdy-ousg](https://dune.com/lindyhan/ondo-usdy-ousg)
