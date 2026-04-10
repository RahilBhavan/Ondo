# Component Conventions

## Design System
- Dark terminal aesthetic: bg #0A0E17, monospace data typography
- No purple gradients. Accent color: green or amber (TBD Phase 2)
- Bloomberg Terminal meets Dune Analytics — institutional, not consumer crypto

## Data Integrity
- Every metric rendered with `DataSourceBadge` component
- Three states: Live (green), Estimated (yellow), Mocked (gray)
- Mocked values prefixed with "~"

## Component Structure (Phase 2)
- `/dashboard` — full-width chart/table components (one per pillar)
- `/ui` — reusable atoms (DataSourceBadge, LoadingSkeleton, Tooltip)
- All data comes via props from page.tsx — components don't fetch directly
- Types imported from `@/lib/types`
