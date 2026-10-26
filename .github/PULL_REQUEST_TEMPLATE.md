## Summary

<!-- What changed and why. -->

## Checklist

- [ ] CI green
- [ ] Every new metric renders a `DataSourceBadge` (live | estimated | cached)
- [ ] No mocked values; fallbacks come from `src/data/last-good.json` with their original `asOf`
- [ ] Dune SQL changes mirrored in `/queries`
- [ ] Live numbers spot-checked against Etherscan (link txs):
- [ ] `STATUS.md` / `DEVLOG.md` updated if the phase changed
