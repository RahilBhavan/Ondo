-- Pillar 1: Top Ethereum holders of OUSG and USDY
-- Net balance per address from ERC-20 Transfer events, top 15 per token.
-- USD value is applied in the app (src/lib/topHolders.ts) from the Ondo oracle price.
--
-- Covers: Ethereum mainnet only (ADR-005)
--   OUSG 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92 (18 decimals)
--   USDY 0x96F6eF951840721AdBF46Ac996b59E0235CB985C (18 decimals)
-- Output: token, address, balance (token units), last_activity

WITH transfers AS (
  SELECT
    CASE contract_address
      WHEN 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92 THEN 'OUSG'
      ELSE 'USDY'
    END AS token,
    "from",
    "to",
    CAST(value AS DOUBLE) / 1e18 AS amount,
    evt_block_time
  FROM erc20_ethereum.evt_Transfer
  WHERE contract_address IN (
    0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92,
    0x96F6eF951840721AdBF46Ac996b59E0235CB985C
  )
),

legs AS (
  SELECT token, "to" AS address, amount, evt_block_time FROM transfers
  UNION ALL
  SELECT token, "from" AS address, -amount, evt_block_time FROM transfers
),

balances AS (
  SELECT
    token,
    address,
    SUM(amount) AS balance,
    MAX(evt_block_time) AS last_activity
  FROM legs
  WHERE address != 0x0000000000000000000000000000000000000000
  GROUP BY token, address
),

ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY token ORDER BY balance DESC) AS rn
  FROM balances
  WHERE balance > 0
)

SELECT token, address, balance, last_activity
FROM ranked
WHERE rn <= 15
ORDER BY token, balance DESC
