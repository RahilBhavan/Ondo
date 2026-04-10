-- Pillar 3 Support: Chain Breakdown
-- Computes USDY holder balances and distribution across EVM chains.
-- Non-EVM chains (Solana, Sui, etc.) are not available on Dune — mocked in application.
--
-- Note: OUSG is primarily Ethereum. USDY spans multiple chains.
-- Each chain's decoded table follows ondofinance_{chain}.USDY_evt_Transfer pattern.
--
-- This query covers Ethereum only. Mantle/Arbitrum queries follow same pattern
-- but target ondofinance_mantle / ondofinance_arbitrum namespaces.
-- Output: chain, token, tvl_usd, holder_count, tx_count_30d, pct_of_total

WITH usdy_balances AS (
  SELECT
    "to" AS address,
    CAST(value AS DOUBLE) / 1e18 AS amount
  FROM ondofinance_ethereum.USDY_evt_Transfer
  UNION ALL
  SELECT
    "from" AS address,
    -CAST(value AS DOUBLE) / 1e18 AS amount
  FROM ondofinance_ethereum.USDY_evt_Transfer
  WHERE "from" != 0x0000000000000000000000000000000000000000
),

holder_balances AS (
  SELECT
    address,
    SUM(amount) AS balance
  FROM usdy_balances
  GROUP BY address
  HAVING SUM(amount) > 0.01
),

tx_counts AS (
  SELECT COUNT(*) AS tx_count_30d
  FROM ondofinance_ethereum.USDY_evt_Transfer
  WHERE evt_block_time >= NOW() - INTERVAL '30' DAY
),

ousg_balances AS (
  SELECT
    "to" AS address,
    CAST(value AS DOUBLE) / 1e18 AS amount
  FROM ondofinance_ethereum.OUSG_evt_Transfer
  UNION ALL
  SELECT
    "from" AS address,
    -CAST(value AS DOUBLE) / 1e18 AS amount
  FROM ondofinance_ethereum.OUSG_evt_Transfer
  WHERE "from" != 0x0000000000000000000000000000000000000000
),

ousg_holder_balances AS (
  SELECT
    address,
    SUM(amount) AS balance
  FROM ousg_balances
  GROUP BY address
  HAVING SUM(amount) > 0.01
),

ousg_tx_counts AS (
  SELECT COUNT(*) AS tx_count_30d
  FROM ondofinance_ethereum.OUSG_evt_Transfer
  WHERE evt_block_time >= NOW() - INTERVAL '30' DAY
)

SELECT
  'ethereum' AS chain,
  'USDY' AS token,
  SUM(balance) * 1.05 AS tvl_usd,
  COUNT(*) AS holder_count,
  (SELECT tx_count_30d FROM tx_counts) AS tx_count_30d
FROM holder_balances
WHERE address != 0x0000000000000000000000000000000000000000

UNION ALL

SELECT
  'ethereum' AS chain,
  'OUSG' AS token,
  SUM(balance) * 107.0 AS tvl_usd,
  COUNT(*) AS holder_count,
  (SELECT tx_count_30d FROM ousg_tx_counts) AS tx_count_30d
FROM ousg_holder_balances
WHERE address != 0x0000000000000000000000000000000000000000
