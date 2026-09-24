const CONTRACTS = [
  { label: 'OUSG InstantManager', address: '0x93358db73B6cd4b98D89c8F5f230E81a95c2643a' },
  { label: 'OUSG InstantManager (legacy, Apr 2024 to Apr 2025)', address: '0x2826989983e3a66F0622132D019c2Ae173eb6A43' },
  { label: 'USDY InstantManager', address: '0xa42613C243b67BF6194Ac327795b926B4b491f15' },
];

const code = 'font-mono text-[13px] text-[color:var(--ink)]';

/** Same facts as MethodologyDrawer (Pillar 2) and docs/METHODOLOGY.md; keep them in sync. */
export function FlowsMethodology() {
  return (
    <section id="methodology" aria-labelledby="methodology-heading" className="scroll-mt-20 space-y-6">
      <h2
        id="methodology-heading"
        className="text-2xl font-semibold tracking-[-0.96px] text-[color:var(--ink)]"
      >
        Methodology
      </h2>
      <dl className="grid gap-6 text-[15px] leading-relaxed text-[color:var(--body)] md:grid-cols-[180px_1fr]">
        <dt className="font-medium text-[color:var(--ink)]">Contracts</dt>
        <dd className="min-w-0">
          <ul className="space-y-2">
            {CONTRACTS.map((c) => (
              <li key={c.address}>
                {c.label} on Ethereum:{' '}
                <a
                  href={`https://etherscan.io/address/${c.address}`}
                  className="break-all font-mono text-[13px] text-[color:var(--link)] hover:underline"
                >
                  {c.address}
                </a>
              </li>
            ))}
          </ul>
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Events</dt>
        <dd>
          <code className={code}>Subscription</code> is a mint, <code className={code}>Redemption</code> is a
          redeem. USD value is <code className={code}>depositUSDValue</code> or{' '}
          <code className={code}>redemptionUSDValue</code>, 1e18-scaled and emitted by the contract, so no price
          oracle is involved.
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Legacy OUSG</dt>
        <dd>
          The legacy contract emits <code className={code}>InstantMint</code> and{' '}
          <code className={code}>InstantRedemption</code> events. USD value is the USDC amount in or out, with
          USDC taken at $1.
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">USDY</dt>
        <dd>
          The USDY InstantManager emits the same <code className={code}>Subscription</code> and{' '}
          <code className={code}>Redemption</code> events as OUSG. USDY history starts Dec 2025, when the contract
          went live.
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Week</dt>
        <dd>
          Weeks start Monday 00:00 UTC of the block time. The current week is partial, so the headline figures use the last complete week.
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Wallets</dt>
        <dd>
          Distinct <code className={code}>subscriber</code> and <code className={code}>redeemer</code> addresses.
          Unique wallets counts an address once per week even if it both minted and redeemed. KYC ids are not
          used.
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Scope</dt>
        <dd>
          Instant mint and redeem only. Not secondary transfers, DEX trades, bridged balances, or other chains
          (ADR-005).
        </dd>

        <dt className="font-medium text-[color:var(--ink)]">Source</dt>
        <dd>
          Event logs from the{' '}
          <a href="https://eth.blockscout.com/api-docs" className="text-[color:var(--link)] hover:underline">
            Blockscout logs API
          </a>
          , decoded and grouped by week in <code className={code}>src/lib/flowEvents.ts</code>. The same
          definition in SQL is <code className={code}>queries/mint_redeem_volume.sql</code>.
        </dd>
      </dl>
    </section>
  );
}
