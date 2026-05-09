---
Task ID: 1
Agent: Main
Task: Make dashboard time period filters (This Week/Month/Quarter/Year) reflect results accordingly

Work Log:
- Read dashboard component (1669 lines), dashboard API route (511 lines), and related files
- Identified that frontend only sent startDate/endDate when activePeriod !== 'thisYear'
- Identified that backend didn't apply date range filtering to monthlyProgress, quarterlyProgress, monthlyRevenueTrend, and recentProposals
- Rewrote backend API route to: (a) fetch all proposals once and filter in JS for efficiency, (b) apply date range filtering to ALL sections, (c) filter monthly/quarterly progress to only show periods overlapping with selected date range, (d) pro-rate annual target for sub-year periods, (e) add periodInfo to API response
- Updated frontend to always send startDate/endDate in queryParams
- Updated KPI card labels to show period-aware text (e.g., "Period Progress" vs "Monthly Progress")
- Updated chart titles to show period subtitle when not full year
- Updated Recent Activity title to match Quarterly Progress style
- Added periodInfo to DashboardData interface
- Fixed SortField type in proposals.tsx (added 'createdAt')
- Added createdAt case to sort switch in proposals.tsx
- Verified proposal statuses already include Submitted, In Evaluation, Rejected
- Verified Business Targets year selector already has ±10 range + custom year input
- Verified chatbot already has full CRM data access
- Verified reports already have category-based filtering
- All lint checks pass, dev server runs without errors

Stage Summary:
- Dashboard time period filters now work correctly: This Week shows only that week's data, This Month shows only that month's data, etc.
- Monthly/Quarterly progress charts dynamically adjust to show only relevant periods
- Target achievement pro-rates annual target for sub-year periods
- All KPI cards, stats, charts reflect the selected date range
- Recent Activity title matches Quarterly Progress style format
