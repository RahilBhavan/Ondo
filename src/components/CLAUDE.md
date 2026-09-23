# Component Conventions

## Design System
- Follow `/DESIGN.md`. Use the CSS tokens in `src/app/globals.css` (light + dark); never hardcode hex.
- Shared page frame: `src/components/ui/PageShell.tsx`. Sans for text, mono only for small labels and numbers.
- Institutional, not consumer crypto

## Data Integrity
- Every metric rendered with `DataSourceBadge` component
- Three states: Live (green), Estimated (yellow), Mocked (gray)
- Mocked values prefixed with "~"

## Component Structure (Phase 2)
- `/dashboard` — full-width chart/table components (one per pillar)
- `/ui` — reusable atoms (DataSourceBadge, LoadingSkeleton, Tooltip)
- All data comes via props from page.tsx — components don't fetch directly
- Types imported from `@/lib/types`
