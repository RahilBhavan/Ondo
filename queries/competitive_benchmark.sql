-- Pillar 4: Competitive Benchmark
-- Compares Nexus (OUSG+USDY) vs Superstate (USTB), OpenEden (TBILL)
-- on TVL and 30-day volume from on-chain Transfer events.
--
-- Franklin Templeton (BENJI) data is from public disclosures — mocked in application.
-- Fork candidate: steakhouse/tokenized-securities dashboard.
--
-- Token addresses (Ethereum):
--   OUSG:  0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92
--   USDY:  0x96F6eF951840721AdBF46Ac996b59E0235CB985C
--   USTB:  0x43415eB6ff9DB7E26A15b704e7A3eDCe97d96C47 (Superstate)
--   TBILL: 0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a (OpenEden)
--
-- Output: protocol, tvl_usd, volume_30d_usd

WITH token_config AS (
  SELECT 'nexus_ousg' AS protocol, 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92 AS token_address, 107.0 AS price, 18 AS decimals
  UNION ALL SELECT 'nexus_usdy', 0x96F6eF951840721AdBF46Ac996b59E0235CB985C, 1.05, 18
  UNION ALL SELECT 'superstate', 0x43415eB6ff9DB7E26A15b704e7A3eDCe97d96C47, 1.0, 6
  UNION ALL SELECT 'openeden', 0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a, 1.0, 18
),

-- Compute current supply (proxy for TVL) from Transfer events
supplies AS (
  SELECT
    tc.protocol,
    SUM(
      CASE WHEN t."from" = 0x0000000000000000000000000000000000000000
      THEN CAST(t.value AS DOUBLE) / POWER(10, tc.decimals)
      ELSE 0 END
    ) -
    SUM(
      CASE WHEN t."to" = 0x0000000000000000000000000000000000000000
      THEN CAST(t.value AS DOUBLE) / POWER(10, tc.decimals)
      ELSE 0 END
    ) AS total_supply,
    tc.price
  FROM erc20_ethereum.evt_Transfer t
  JOIN token_config tc ON t.contract_address = tc.token_address
  GROUP BY tc.protocol, tc.price
),

-- 30-day transfer volume
volumes AS (
  SELECT
    tc.protocol,
    SUM(CAST(t.value AS DOUBLE) / POWER(10, tc.decimals) * tc.price) AS volume_30d_usd
  FROM erc20_ethereum.evt_Transfer t
  JOIN token_config tc ON t.contract_address = tc.token_address
  WHERE t.evt_block_time >= NOW() - INTERVAL '30' DAY
    AND t."from" != 0x0000000000000000000000000000000000000000
    AND t."to" != 0x0000000000000000000000000000000000000000
  GROUP BY tc.protocol
)

SELECT
  CASE
    WHEN s.protocol LIKE 'nexus%' THEN 'nexus'
    ELSE s.protocol
  END AS protocol,
  SUM(s.total_supply * s.price) AS tvl_usd,
  SUM(COALESCE(v.volume_30d_usd, 0)) AS volume_30d_usd
FROM supplies s
LEFT JOIN volumes v ON s.protocol = v.protocol
GROUP BY
  CASE
    WHEN s.protocol LIKE 'nexus%' THEN 'nexus'
    ELSE s.protocol
  END
ORDER BY tvl_usd DESC
