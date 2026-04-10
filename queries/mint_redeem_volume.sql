-- Pillar 2: Daily Mint/Redeem Volume & Frequency
-- Queries Subscription + Redemption events from OUSG and USDY InstantManagers.
-- 90-day rolling window, daily aggregation.
--
-- OUSG InstantManager: 0x93358db73B6cd4b98D89c8F5f230E81a95c2643a
-- USDY InstantManager: 0xa42613C243b67BF6194Ac327795b926B4b491f15
--
-- Note: Redemptions are atomic (ADR-004). No settlement delta — volume only.
-- Output: date, token, mint_volume_usd, redeem_volume_usd, mint_count, redeem_count

WITH ousg_mints AS (
  SELECT
    DATE_TRUNC('day', evt_block_time) AS dt,
    'OUSG' AS token,
    'mint' AS event_type,
    CAST(depositUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.OUSGInstantManager_evt_Subscription
  WHERE evt_block_time >= NOW() - INTERVAL '90' DAY
),

ousg_redeems AS (
  SELECT
    DATE_TRUNC('day', evt_block_time) AS dt,
    'OUSG' AS token,
    'redeem' AS event_type,
    CAST(redemptionUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.OUSGInstantManager_evt_Redemption
  WHERE evt_block_time >= NOW() - INTERVAL '90' DAY
),

usdy_mints AS (
  SELECT
    DATE_TRUNC('day', evt_block_time) AS dt,
    'USDY' AS token,
    'mint' AS event_type,
    CAST(depositUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.USDYInstantManager_evt_Subscription
  WHERE evt_block_time >= NOW() - INTERVAL '90' DAY
),

usdy_redeems AS (
  SELECT
    DATE_TRUNC('day', evt_block_time) AS dt,
    'USDY' AS token,
    'redeem' AS event_type,
    CAST(redemptionUSDValue AS DOUBLE) / 1e18 AS usd_value
  FROM ondofinance_ethereum.USDYInstantManager_evt_Redemption
  WHERE evt_block_time >= NOW() - INTERVAL '90' DAY
),

all_events AS (
  SELECT * FROM ousg_mints
  UNION ALL SELECT * FROM ousg_redeems
  UNION ALL SELECT * FROM usdy_mints
  UNION ALL SELECT * FROM usdy_redeems
)

SELECT
  dt AS date,
  token,
  SUM(CASE WHEN event_type = 'mint' THEN usd_value ELSE 0 END) AS mint_volume_usd,
  SUM(CASE WHEN event_type = 'redeem' THEN usd_value ELSE 0 END) AS redeem_volume_usd,
  SUM(CASE WHEN event_type = 'mint' THEN 1 ELSE 0 END) AS mint_count,
  SUM(CASE WHEN event_type = 'redeem' THEN 1 ELSE 0 END) AS redeem_count
FROM all_events
GROUP BY dt, token
ORDER BY dt DESC, token
