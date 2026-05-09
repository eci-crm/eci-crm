# Task: Create Enhanced CRM Pro Dashboard

## Summary
Created a comprehensive, data-rich CRM Pro Dashboard component at `/home/z/my-project/src/components/crm/dashboard.tsx`.

## Files Created/Modified

### Created
- **`src/components/crm/dashboard.tsx`** — Main dashboard component (~1100 lines)
- **`src/components/providers.tsx`** — QueryClientProvider wrapper for TanStack Query
- **`seed.ts`** — Database seed script (2025 data)
- **`seed-2026.ts`** — Additional seed script (2026 data, current year)

### Modified
- **`src/app/layout.tsx`** — Added Providers wrapper around children
- **`src/app/page.tsx`** — Replaced default content with CRMDashboard component

## Dashboard Features

### Filter Bar
- Date Range picker (from/to inputs)
- Service filter (Select dropdown, fetched from /api/services)
- Month selector (All, Jan-Dec)
- Quarter selector (All, Q1-Q4)
- Year selector (2024, 2025, 2026)
- Clear Filters button

### Row 1: KPI Cards (4 cards)
1. **Total Business** — Sum of won proposal values with trending icon
2. **Target vs Actual** — Circular progress indicator with percentage
3. **Monthly Progress** — Progress bar with current month target vs actual
4. **Proposal Status** — Won count / total with mini donut visualization

### Row 2: Charts
- **Target vs Actual BarChart** — Monthly or quarterly based on filter
- **Service-wise Business Summary** — Horizontal bar chart by service

### Row 3: Analytics
- **Proposal Status Distribution** — PieChart with legend
- **Quarterly Progress** — Stacked progress bars for each quarter

### Row 4: Tables
- **Recent Proposals** — Last 5 proposals with status badges
- **Upcoming Deadlines** — Proposals with deadlines within 7 days

## Technical Details
- Uses `useQuery` from TanStack Query for data fetching
- Recharts for all chart visualizations
- shadcn/ui components (Card, Badge, Select, Button, Progress, Table, etc.)
- date-fns for date formatting
- Lucide React icons
- PKR currency formatting (₨)
- Status color coding: Submitted=blue, In Process=amber, In Evaluation=purple, Pending=orange, Won=green
- CircularProgress and MiniDonut sub-components declared outside main component to avoid re-creation

## Lint Status
- No lint errors in dashboard.tsx
- Pre-existing errors in other files (crm-layout.tsx, proposals.tsx) unrelated to this task
