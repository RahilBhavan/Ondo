-- Reference definition. The app no longer runs this on Dune (ADR-008): src/lib/flowEvents.ts
-- computes the same aggregation from the same events, read from Blockscout's logs API.
-- Keep the two in sync; this file stays as the documented metric definition.
--
-- Pillar 2: Weekly Mint/Redeem Volume, Frequency & Wallets
-- Saved on Dune: https://dune.com/queries/8822192 (formerly DUNE_MINT_REDEEM_QUERY_ID)
-- Full history, weekly aggregation (DATE_TRUNC('week') = Monday 00:00 UTC). The current week is partial.
--
-- Sources (verified on Dune 2026-09-23):
--   OUSG InstantManager      0x93358db73B6cd4b98D89c8F5f230E81a95c2643a  (Apr 2025 onward)
--     decoded: ondo_ethereum.ousg_instantmanager_evt_subscription / _evt_redemption
--     USD value: depositUSDValue / redemptionUSDValue, 1e18-scaled, emitted by the contract
--   Legacy OUSG InstantManager 0x2826989983e3a66f0622132d019c2ae173eb6a43  (Apr 2024 to Apr 2025)
--     decoded: ondofinance_ethereum.ousginstantmanager_evt_instantmint[rebasing]ousg / _evt_instantredemption[rebasing]ousg
--     USD value: USDC amount in/out, 1e6-scaled (USDC taken at $1). Plain and rebasing events never share a tx.
--   USDY InstantManager      0xa42613C243b67BF6194Ac327795b926B4b491f15  (Dec 2025 onward)
--     NOT decoded on Dune: read from ethereum.logs using the same Subscription / Redemption
--     signatures as the OUSG contract (topic0 below). topic1 = wallet, data word 4 = USD value (1e18).
--     This raw decode reproduces the decoded OUSG totals exactly (checked 2026-09-23).
--
-- Only Subscription / Redemption (and the legacy InstantMint / InstantRedemption) are read. The rebasing
-- events on the current contracts fire alongside them and are skipped to avoid double counting.
-- Scope: Ethereum only (ADR-005). Instant mint/redeem only, not secondary transfers.
-- Wallets are the subscriber / redeemer / sender addresses; the *Id KYC hashes are never used.
-- Redemptions are atomic (ADR-004). No settlement delta, volume only.
--
-- Output: week, token, mint_volume_usd, redeem_volume_usd, net_flow_usd, mint_count, redeem_count,
--         unique_minters, unique_redeemers, unique_wallets

WITH ousg_mints AS (
  SELECT evt_block_time AS ts, 'OUSG' AS token, 'mint' AS event_type, subscriber AS wallet,
    CAST(depositusdvalue AS DOUBLE) / 1e18 AS usd_value
  FROM ondo_ethereum.ousg_instantmanager_evt_subscription
),

ousg_redeems AS (
  SELECT evt_block_time, 'OUSG', 'redeem', redeemer,
    CAST(redemptionusdvalue AS DOUBLE) / 1e18
  FROM ondo_ethereum.ousg_instantmanager_evt_redemption
),

ousg_legacy_mints AS (
  SELECT evt_block_time, 'OUSG', 'mint', sender, CAST(usdcamountin AS DOUBLE) / 1e6
  FROM ondofinance_ethereum.ousginstantmanager_evt_instantmintousg
  UNION ALL
  SELECT evt_block_time, 'OUSG', 'mint', sender, CAST(usdcamountin AS DOUBLE) / 1e6
  FROM ondofinance_ethereum.ousginstantmanager_evt_instantmintrebasingousg
),

ousg_legacy_redeems AS (
  SELECT evt_block_time, 'OUSG', 'redeem', sender, CAST(usdcamountout AS DOUBLE) / 1e6
  FROM ondofinance_ethereum.ousginstantmanager_evt_instantredemptionousg
  UNION ALL
  SELECT evt_block_time, 'OUSG', 'redeem', sender, CAST(usdcamountout AS DOUBLE) / 1e6
  FROM ondofinance_ethereum.ousginstantmanager_evt_instantredemptionrebasingousg
),

usdy_events AS (
  SELECT
    block_time,
    'USDY',
    CASE topic0
      WHEN 0x5c88561b046569d4773b016d48f154d22685738bfb692bb0f8478ec2ef36b79f THEN 'mint'   -- Subscription
      ELSE 'redeem'                                                                        -- Redemption
    END,
    bytearray_substring(topic1, 13, 20),
    CAST(bytearray_to_uint256(bytearray_substring(data, 97, 32)) AS DOUBLE) / 1e18
  FROM ethereum.logs
  WHERE contract_address = 0xa42613C243b67BF6194Ac327795b926B4b491f15
    AND topic0 IN (
      0x5c88561b046569d4773b016d48f154d22685738bfb692bb0f8478ec2ef36b79f,
      0x7023b7bcd020761014c9e1590603f4effceabc102cf0b8023c3f2b14db9ffb6e
    )
),

all_events AS (
  SELECT DATE_TRUNC('week', ts) AS week, token, event_type, wallet, usd_value FROM (
    SELECT * FROM ousg_mints
    UNION ALL SELECT * FROM ousg_redeems
    UNION ALL SELECT * FROM ousg_legacy_mints
    UNION ALL SELECT * FROM ousg_legacy_redeems
    UNION ALL SELECT * FROM usdy_events
  )
)

SELECT
  week,
  token,
  SUM(CASE WHEN event_type = 'mint' THEN usd_value ELSE 0 END) AS mint_volume_usd,
  SUM(CASE WHEN event_type = 'redeem' THEN usd_value ELSE 0 END) AS redeem_volume_usd,
  SUM(CASE WHEN event_type = 'mint' THEN usd_value ELSE -usd_value END) AS net_flow_usd,
  COUNT_IF(event_type = 'mint') AS mint_count,
  COUNT_IF(event_type = 'redeem') AS redeem_count,
  COUNT(DISTINCT CASE WHEN event_type = 'mint' THEN wallet END) AS unique_minters,
  COUNT(DISTINCT CASE WHEN event_type = 'redeem' THEN wallet END) AS unique_redeemers,
  COUNT(DISTINCT wallet) AS unique_wallets
FROM all_events
GROUP BY week, token
ORDER BY week, token
