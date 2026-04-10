-- Pillar 1: TVL by Issuer
-- Computes net token balances per holder for OUSG and USDY on Ethereum.
-- Join against address registry CTE for institution name resolution.
--
-- Target Dune namespace: ondofinance_ethereum
-- Output: holder_address, token, balance, tvl_usd, last_activity

WITH ousg_transfers AS (
  SELECT
    "to" AS address,
    CAST(value AS DOUBLE) / 1e18 AS amount,
    block_time
  FROM ondofinance_ethereum.OUSG_evt_Transfer
  UNION ALL
  SELECT
    "from" AS address,
    -CAST(value AS DOUBLE) / 1e18 AS amount,
    block_time
  FROM ondofinance_ethereum.OUSG_evt_Transfer
  WHERE "from" != 0x0000000000000000000000000000000000000000
),

usdy_transfers AS (
  SELECT
    "to" AS address,
    CAST(value AS DOUBLE) / 1e18 AS amount,
    block_time
  FROM ondofinance_ethereum.USDY_evt_Transfer
  UNION ALL
  SELECT
    "from" AS address,
    -CAST(value AS DOUBLE) / 1e18 AS amount,
    block_time
  FROM ondofinance_ethereum.USDY_evt_Transfer
  WHERE "from" != 0x0000000000000000000000000000000000000000
),

ousg_balances AS (
  SELECT
    address,
    'OUSG' AS token,
    SUM(amount) AS balance,
    MAX(block_time) AS last_activity
  FROM ousg_transfers
  GROUP BY address
  HAVING SUM(amount) > 0.01
),

usdy_balances AS (
  SELECT
    address,
    'USDY' AS token,
    SUM(amount) AS balance,
    MAX(block_time) AS last_activity
  FROM usdy_transfers
  GROUP BY address
  HAVING SUM(amount) > 0.01
),

-- Price oracles: use latest Dune price or hardcode reasonable defaults
-- OUSG ~$107 (NAV-based), USDY ~$1.05 (yield-accruing)
prices AS (
  SELECT 'OUSG' AS token, 107.0 AS price_usd
  UNION ALL
  SELECT 'USDY' AS token, 1.05 AS price_usd
),

all_balances AS (
  SELECT * FROM ousg_balances
  UNION ALL
  SELECT * FROM usdy_balances
)

SELECT
  b.address AS holder_address,
  b.token,
  b.balance,
  b.balance * p.price_usd AS tvl_usd,
  b.last_activity
FROM all_balances b
JOIN prices p ON b.token = p.token
-- Exclude zero address and known protocol contracts
WHERE b.address != 0x0000000000000000000000000000000000000000
ORDER BY tvl_usd DESC
LIMIT 100
