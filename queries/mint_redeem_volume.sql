-- Pillar 2: Weekly Mint/Redeem Volume, Frequency & Wallets
-- Queries Subscription (mint) + Redemption (redeem) events from the OUSG and USDY InstantManagers.
-- Full history, weekly aggregation (DATE_TRUNC('week') = Monday 00:00 UTC). The current week is partial.
--
-- OUSG InstantManager: 0x93358db73B6cd4b98D89c8F5f230E81a95c2643a
-- USDY InstantManager: 0xa42613C243b67BF6194Ac327795b926B4b491f15
-- Events: Subscription(subscriber, subscriberId, ..., depositUSDValue, fee)
--         Redemption(redeemer, redeemerId, ..., redemptionUSDValue, fee)
--
-- Scope: Ethereum only (ADR-005). Instant mint/redeem only, not secondary transfers.
-- Wallets are the subscriber / redeemer addresses; the *Id KYC hashes are never used.
-- USD values are emitted by the contract (1e18-scaled), no price oracle.
-- Note: Redemptions are atomic (ADR-004). No settlement delta, volume only.
--
-- TODO(#1): confirm whether Dune decodes the deprecated legacy OUSG InstantManager (0x28269899..., see docs/CONTRACT_RESEARCH.md); if so UNION it in
--
-- Output: week, token, mint_volume_usd, redeem_volume_usd, net_flow_usd, mint_count, redeem_count,
--         unique_minters, unique_redeemers, unique_wallets

WITH ousg_mints AS (
  SELECT
    DATE_TRUNC('week', evt_block_time) AS week,
    'OUSG' AS token,
    'mint' AS event_type,
    subscriber AS wallet,
    CAST(depositUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.OUSGInstantManager_evt_Subscription
),

ousg_redeems AS (
  SELECT
    DATE_TRUNC('week', evt_block_time) AS week,
    'OUSG' AS token,
    'redeem' AS event_type,
    redeemer AS wallet,
    CAST(redemptionUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.OUSGInstantManager_evt_Redemption
),

usdy_mints AS (
  SELECT
    DATE_TRUNC('week', evt_block_time) AS week,
    'USDY' AS token,
    'mint' AS event_type,
    subscriber AS wallet,
    CAST(depositUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.USDYInstantManager_evt_Subscription
),

usdy_redeems AS (
  SELECT
    DATE_TRUNC('week', evt_block_time) AS week,
    'USDY' AS token,
    'redeem' AS event_type,
    redeemer AS wallet,
    CAST(redemptionUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.USDYInstantManager_evt_Redemption
),

all_events AS (
  SELECT * FROM ousg_mints
  UNION ALL SELECT * FROM ousg_redeems
  UNION ALL SELECT * FROM usdy_mints
  UNION ALL SELECT * FROM usdy_redeems
)

SELECT
  week,
  token,
  SUM(CASE WHEN event_type = 'mint' THEN usd_value ELSE 0 END) AS mint_volume_usd,
  SUM(CASE WHEN event_type = 'redeem' THEN usd_value ELSE 0 END) AS redeem_volume_usd,
  SUM(CASE WHEN event_type = 'mint' THEN usd_value ELSE -usd_value END) AS net_flow_usd,
  SUM(CASE WHEN event_type = 'mint' THEN 1 ELSE 0 END) AS mint_count,
  SUM(CASE WHEN event_type = 'redeem' THEN 1 ELSE 0 END) AS redeem_count,
  COUNT(DISTINCT CASE WHEN event_type = 'mint' THEN wallet END) AS unique_minters,
  COUNT(DISTINCT CASE WHEN event_type = 'redeem' THEN wallet END) AS unique_redeemers,
  COUNT(DISTINCT wallet) AS unique_wallets
FROM all_events
GROUP BY week, token
ORDER BY week, token
