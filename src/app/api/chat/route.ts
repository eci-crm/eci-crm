import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── CRM Summary Cache ───────────────────────────────────────────────────────

let summaryCache: { data: string; timestamp: number } | null = null
const SUMMARY_CACHE_TTL = 30000 // 30 seconds

// ─── Helper: Date range calculation ──────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999)
  return { start, end }
}

function getMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function getQuarterRange(): { start: Date; end: Date } {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
  return { start, end }
}

function getYearRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { start, end }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(value: number): string {
  return `₨ ${value.toLocaleString('en-PK')}`
}

/** Get the effective date for a proposal (submissionDate or createdAt fallback) */
function getProposalDate(p: { submissionDate: Date | null; createdAt: Date }): Date {
  return p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
}

// ─── Fetch CRM Summary Data (Optimized: parallel queries + cache + enhanced context) ──

async function fetchCRMSummary(): Promise<string> {
  // Return cached summary if still fresh
  if (summaryCache && Date.now() - summaryCache.timestamp < SUMMARY_CACHE_TTL) {
    return summaryCache.data
  }

  const now = new Date()
  const year = now.getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  // ── Batch all independent queries in parallel ──────────────────────────────
  const [
    allProposals,
    allServices,
    allThematicAreas,
    activeMembers,
    allClients,
    targets,
    resourceCount,
    folderCount,
    settings,
    // Historical data for previous 2 years
    prevYear1Proposals,
    prevYear2Proposals,
  ] = await Promise.all([
    // 1. All proposals with every relation needed for downstream computation
    db.proposal.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        status: true,
        createdAt: true,
        submissionDate: true,
        deadline: true,
        clientId: true,
        assignedMemberId: true,
        client: { select: { name: true } },
        assignedMember: { select: { name: true, role: true } },
        services: { select: { serviceId: true, service: { select: { name: true } } } },
        thematicAreas: { select: { thematicAreaId: true, thematicArea: { select: { name: true } } } },
      },
    }),
    // 2. All services ordered by sortOrder
    db.service.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
    // 3. All thematic areas ordered by sortOrder
    db.thematicArea.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
    // 4. Active team members
    db.teamMember.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    }),
    // 5. All clients (for status counts & new-this-month)
    db.client.findMany({
      select: { status: true, createdAt: true },
    }),
    // 6. Business targets for the year
    db.businessTarget.findMany({ where: { year } }),
    // 7. Resource counts
    db.resource.count(),
    // 8. Folder counts
    db.resourceFolder.count(),
    // 9. Company settings
    db.setting.findMany(),
    // 10. Proposals from 2 years ago for historical comparison
    db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: new Date(year - 1, 0, 1), lte: new Date(year - 1, 11, 31, 23, 59, 59, 999) } },
          { submissionDate: null, createdAt: { gte: new Date(year - 1, 0, 1), lte: new Date(year - 1, 11, 31, 23, 59, 59, 999) } },
        ],
      },
      select: { status: true, value: true },
    }),
    // 11. Proposals from 3 years ago for historical comparison
    db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: new Date(year - 2, 0, 1), lte: new Date(year - 2, 11, 31, 23, 59, 59, 999) } },
          { submissionDate: null, createdAt: { gte: new Date(year - 2, 0, 1), lte: new Date(year - 2, 11, 31, 23, 59, 59, 999) } },
        ],
      },
      select: { status: true, value: true },
    }),
  ])

  // ── Company name from settings ─────────────────────────────────────────────
  const companyName = settings.find(s => s.key === 'companyName')?.value || 'ECI CRM'

  // ── Client counts (single-pass over allClients) ────────────────────────────
  const totalClients = allClients.length
  let activeClients = 0
  let inactiveClients = 0
  let newClientsThisMonth = 0
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  for (const c of allClients) {
    if (c.status === 'Active') activeClients++
    else if (c.status === 'Inactive') inactiveClients++
    if (new Date(c.createdAt) >= monthStart) newClientsThisMonth++
  }

  // ── Proposal status counts (all time & this year) ──────────────────────────
  const statusOrder = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']
  const statusCounts: Record<string, number> = {}
  const yearStatusCounts: Record<string, number> = {}
  for (const s of statusOrder) {
    statusCounts[s] = 0
    yearStatusCounts[s] = 0
  }
  let totalProposals = 0
  let yearTotalProposals = 0

  // Pre-compute per-proposal flags in a single pass
  const proposalInYear: boolean[] = new Array(allProposals.length).fill(false)
  for (let i = 0; i < allProposals.length; i++) {
    const p = allProposals[i]
    if (statusOrder.includes(p.status)) {
      statusCounts[p.status]++
      totalProposals++
    }
    const pDate = getProposalDate(p)
    const inYear = pDate >= yearStart && pDate <= yearEnd
    proposalInYear[i] = inYear
    if (inYear && statusOrder.includes(p.status)) {
      yearStatusCounts[p.status]++
      yearTotalProposals++
    }
  }

  // ── Won proposals this year (reused for business won, monthly/quarterly, top clients, team) ──
  let totalBusinessWon = 0
  const monthlyValues = new Array(12).fill(0)
  const quarterlyValues = new Array(4).fill(0)
  const clientWonMap: Record<string, { name: string; wonValue: number }> = {}
  const memberWonMap = new Map<string, { wonCount: number; wonValue: number }>()
  for (const m of activeMembers) {
    memberWonMap.set(m.id, { wonCount: 0, wonValue: 0 })
  }

  for (let i = 0; i < allProposals.length; i++) {
    const p = allProposals[i]
    if (p.status !== 'Won') continue

    const pDate = getProposalDate(p)
    if (pDate < yearStart || pDate > yearEnd) continue

    // Total business won
    totalBusinessWon += p.value

    // Monthly breakdown (single pass instead of 12 separate queries)
    monthlyValues[pDate.getMonth()] += p.value

    // Quarterly breakdown (single pass instead of 4 separate queries)
    quarterlyValues[Math.floor(pDate.getMonth() / 3)] += p.value

    // Top clients
    if (!clientWonMap[p.clientId]) {
      clientWonMap[p.clientId] = { name: p.client.name, wonValue: 0 }
    }
    clientWonMap[p.clientId].wonValue += p.value

    // Team member performance
    if (p.assignedMemberId) {
      const entry = memberWonMap.get(p.assignedMemberId)
      if (entry) {
        entry.wonCount++
        entry.wonValue += p.value
      }
    }
  }

  // ── Historical Comparison (previous 2 years) ───────────────────────────────
  const prevYear1WonCount = prevYear1Proposals.filter(p => p.status === 'Won').length
  const prevYear1WonValue = prevYear1Proposals.filter(p => p.status === 'Won').reduce((s, p) => s + p.value, 0)
  const prevYear1TotalCount = prevYear1Proposals.length

  const prevYear2WonCount = prevYear2Proposals.filter(p => p.status === 'Won').length
  const prevYear2WonValue = prevYear2Proposals.filter(p => p.status === 'Won').reduce((s, p) => s + p.value, 0)
  const prevYear2TotalCount = prevYear2Proposals.length

  // ── Annual target & remaining months' targets ──────────────────────────────
  const annualTargetRow = targets.find((t) => t.month === null)
  const annualTarget = annualTargetRow
    ? annualTargetRow.amount
    : targets.reduce((sum, t) => sum + t.amount, 0)
  const percentageAchieved = annualTarget > 0 ? Math.round((totalBusinessWon / annualTarget) * 100) : 0

  // Remaining months' targets
  const currentMonth = now.getMonth() + 1 // 1-based
  const remainingMonthTargets = targets
    .filter(t => t.month !== null && t.month >= currentMonth)
    .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))

  const remainingTargetLines = remainingMonthTargets.map(t =>
    `  • ${MONTH_NAMES[(t.month ?? 1) - 1]}: ${formatCurrency(t.amount)}`
  )
  const remainingTargetTotal = remainingMonthTargets.reduce((s, t) => s + t.amount, 0)

  // ── Services summary (computed from allProposals, no N+1) ──────────────────
  const serviceStats = new Map<string, { totalCount: number; wonValueYear: number }>()
  for (const s of allServices) {
    serviceStats.set(s.id, { totalCount: 0, wonValueYear: 0 })
  }
  for (let i = 0; i < allProposals.length; i++) {
    const p = allProposals[i]
    for (const ps of p.services) {
      const stat = serviceStats.get(ps.serviceId)
      if (!stat) continue
      stat.totalCount++
      if (p.status === 'Won' && proposalInYear[i]) {
        stat.wonValueYear += p.value
      }
    }
  }

  const serviceLines: string[] = []
  for (const service of allServices) {
    const stat = serviceStats.get(service.id)!
    serviceLines.push(
      `  • ${service.name}: ${stat.totalCount} proposals, Won value: ${formatCurrency(stat.wonValueYear)}`
    )
  }

  // ── Top clients ────────────────────────────────────────────────────────────
  const topClients = Object.values(clientWonMap)
    .sort((a, b) => b.wonValue - a.wonValue)
    .slice(0, 5)
    .map((c) => `  • ${c.name}: ${formatCurrency(c.wonValue)}`)

  // ── Team members performance ───────────────────────────────────────────────
  const teamLines: string[] = []
  for (const member of activeMembers) {
    const stat = memberWonMap.get(member.id)!
    teamLines.push(
      `  • ${member.name} (${member.role}): ${stat.wonCount} won proposals, ${formatCurrency(stat.wonValue)}`
    )
  }

  // ── Recent proposals (last 5, sorted in-memory) ───────────────────────────
  const recentProposals = allProposals
    .slice() // shallow copy before sorting
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentLines = recentProposals.map(
    (p) =>
      `  • "${p.name}" for ${p.client.name} | Status: ${p.status} | Value: ${formatCurrency(p.value)}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''} | Services: ${p.services.map((s) => s.service.name).join(', ')} | Created: ${formatDate(new Date(p.createdAt))}`
  )

  // ── Upcoming deadlines (next 7 days, filtered in-memory) ───────────────────
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingDeadlines = allProposals
    .filter((p) => p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= sevenDaysLater)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 10)

  const deadlineLines = upcomingDeadlines.map(
    (p) =>
      `  • "${p.name}" for ${p.client.name} | Deadline: ${formatDate(new Date(p.deadline!))}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''} | Value: ${formatCurrency(p.value)}`
  )

  // ── Win rate & pipeline stats ──────────────────────────────────────────────
  const wonCount = statusCounts['Won'] || 0
  const winRate = totalProposals > 0 ? Math.round((wonCount / totalProposals) * 100) : 0
  const yearWinRate =
    yearTotalProposals > 0 ? Math.round((yearStatusCounts['Won'] / yearTotalProposals) * 100) : 0

  const proposalsInRange = allProposals.filter((_, i) => proposalInYear[i])
  const totalProposalValue = proposalsInRange.reduce((sum, p) => sum + p.value, 0)
  const proposalsInRangeCount = proposalsInRange.length
  const avgProposalValue =
    proposalsInRangeCount > 0 ? Math.round(totalProposalValue / proposalsInRangeCount) : 0

  const pipelineValue = allProposals
    .filter((p) => p.status !== 'Won' && p.status !== 'Rejected')
    .reduce((sum, p) => sum + p.value, 0)

  // ── Thematic Areas summary (computed from allProposals, no N+1) ────────────
  const thematicStats = new Map<
    string,
    { totalCount: number; wonValueYear: number; statusBreakdown: Record<string, number> }
  >()
  for (const area of allThematicAreas) {
    thematicStats.set(area.id, { totalCount: 0, wonValueYear: 0, statusBreakdown: {} })
  }
  for (let i = 0; i < allProposals.length; i++) {
    const p = allProposals[i]
    for (const ta of p.thematicAreas) {
      const stat = thematicStats.get(ta.thematicAreaId)
      if (!stat) continue
      stat.totalCount++
      stat.statusBreakdown[p.status] = (stat.statusBreakdown[p.status] || 0) + 1
      if (p.status === 'Won' && proposalInYear[i]) {
        stat.wonValueYear += p.value
      }
    }
  }

  const thematicLines: string[] = []
  for (const area of allThematicAreas) {
    const stat = thematicStats.get(area.id)!
    thematicLines.push(
      `  • ${area.name}: ${stat.totalCount} proposals, Won value: ${formatCurrency(stat.wonValueYear)}, Status: ${Object.entries(stat.statusBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}`
    )
  }

  // ── Monthly breakdown (already computed in single pass above) ──────────────
  const monthlyBreakdown: string[] = []
  for (let m = 0; m < 12; m++) {
    if (monthlyValues[m] > 0) {
      monthlyBreakdown.push(`  • ${MONTH_NAMES[m]}: ${formatCurrency(monthlyValues[m])}`)
    }
  }

  // ── Quarterly breakdown (already computed in single pass above) ────────────
  const quarterlyBreakdown: string[] = []
  for (let q = 0; q < 4; q++) {
    quarterlyBreakdown.push(`  • Q${q + 1}: ${formatCurrency(quarterlyValues[q])}`)
  }

  // ── Build the summary ──────────────────────────────────────────────────────
  const summary = `## Current CRM Summary (as of ${formatDate(now)}):

- Total Clients: ${totalClients} (Active: ${activeClients}, Inactive: ${inactiveClients})
- New Clients This Month: ${newClientsThisMonth}
- Total Proposals (all time): ${totalProposals}
  - Submitted: ${statusCounts['Submitted']}, In Process: ${statusCounts['In Process']}, In Evaluation: ${statusCounts['In Evaluation']}, Pending: ${statusCounts['Pending']}, Won: ${statusCounts['Won']}, Rejected: ${statusCounts['Rejected']}
  - Overall Win Rate: ${winRate}%
- Total Proposals (${year}): ${yearTotalProposals}
  - Submitted: ${yearStatusCounts['Submitted']}, In Process: ${yearStatusCounts['In Process']}, In Evaluation: ${yearStatusCounts['In Evaluation']}, Pending: ${yearStatusCounts['Pending']}, Won: ${yearStatusCounts['Won']}, Rejected: ${yearStatusCounts['Rejected']}
  - Win Rate (${year}): ${yearWinRate}%
- Total Business Won (${year}): ${formatCurrency(totalBusinessWon)}
- Annual Target (${year}): ${formatCurrency(annualTarget)} (${percentageAchieved}% achieved)
- Remaining to Target: ${formatCurrency(Math.max(0, annualTarget - totalBusinessWon))}
- Average Proposal Value: ${formatCurrency(avgProposalValue)}
- Pipeline Value (active proposals): ${formatCurrency(pipelineValue)}

## Monthly Business Breakdown (${year}):
${monthlyBreakdown.join('\n') || '  No won business yet this year'}

## Quarterly Breakdown (${year}):
${quarterlyBreakdown.join('\n')}

## Services (Won value for ${year}):
${serviceLines.join('\n') || '  No services configured'}

## Thematic Areas (for ${year}):
${thematicLines.join('\n') || '  No thematic areas configured'}

## Top Clients (by Won value for ${year}):
${topClients.join('\n') || '  No won proposals yet'}

## Team Members (performance for ${year}):
${teamLines.join('\n') || '  No active team members'}

## Recent Proposals:
${recentLines.join('\n') || '  No proposals yet'}

## Upcoming Deadlines (next 7 days):
${deadlineLines.join('\n') || '  No upcoming deadlines in the next 7 days'}

## Historical Comparison:
- ${year - 1}: ${prevYear1TotalCount} proposals, ${prevYear1WonCount} won, Won value: ${formatCurrency(prevYear1WonValue)}
- ${year - 2}: ${prevYear2TotalCount} proposals, ${prevYear2WonCount} won, Won value: ${formatCurrency(prevYear2WonValue)}

## Future Targets (remaining months in ${year}):
${remainingTargetLines.join('\n') || '  No monthly targets set for remaining months'}
- Total Remaining Monthly Target: ${formatCurrency(remainingTargetTotal)}

## Resources: ${resourceCount} files in ${folderCount} folders`

  // Cache the summary
  summaryCache = { data: summary, timestamp: Date.now() }

  return summary
}

// ─── Smart Query Detection ───────────────────────────────────────────────────

interface QueryContext {
  additionalContext: string
}

async function detectAndFetchQueryContext(userMessage: string): Promise<QueryContext> {
  const lower = userMessage.toLowerCase()
  const contexts: string[] = []

  // Date range detection
  let dateRange: { start: Date; end: Date } | null = null
  let rangeLabel = ''

  if (lower.includes('this week') || lower.includes('past week') || lower.includes('last week')) {
    dateRange = getWeekRange()
    rangeLabel = 'this week'
  } else if (lower.includes('this month') || lower.includes('past month') || lower.includes('current month')) {
    dateRange = getMonthRange()
    rangeLabel = 'this month'
  } else if (lower.includes('this quarter') || lower.includes('current quarter') || lower.includes('past quarter')) {
    dateRange = getQuarterRange()
    rangeLabel = 'this quarter'
  } else if (lower.includes('this year') || lower.includes('current year') || lower.includes('past year')) {
    dateRange = getYearRange()
    rangeLabel = 'this year'
  }

  if (dateRange) {
    const proposalsInRange = await db.proposal.findMany({
      where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
      include: {
        client: { select: { name: true } },
        assignedMember: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const statusBreakdown: Record<string, number> = {}
    let totalValue = 0
    const proposalDetails = proposalsInRange.map((p) => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1
      totalValue += p.value
      return `"${p.name}" for ${p.client.name} | ${p.status} | ${formatCurrency(p.value)} | Services: ${p.services.map((s) => s.service.name).join(', ')}`
    })

    contexts.push(`\n## Proposals ${rangeLabel} (${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}):
- Total: ${proposalsInRange.length} proposals
- Total Value: ${formatCurrency(totalValue)}
- Status Breakdown: ${Object.entries(statusBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Details:
${proposalDetails.map((d) => `  • ${d}`).join('\n')}`)
  }

  // Pre-fetch lookup tables in parallel
  const [allClients, allServices, allThematicAreasForDetection, allMembers] = await Promise.all([
    db.client.findMany({ select: { id: true, name: true } }),
    db.service.findMany({ select: { id: true, name: true } }),
    db.thematicArea.findMany({ select: { id: true, name: true } }),
    db.teamMember.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  // Specific client detection
  for (const client of allClients) {
    if (lower.includes(client.name.toLowerCase())) {
      const clientProposals = await db.proposal.findMany({
        where: { clientId: client.id },
        include: {
          services: { include: { service: { select: { name: true } } } },
          assignedMember: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const wonValue = clientProposals.filter((p) => p.status === 'Won').reduce((s, p) => s + p.value, 0)
      const clientDetails = clientProposals.map(
        (p) =>
          `"${p.name}" | ${p.status} | ${formatCurrency(p.value)} | Services: ${p.services.map((s) => s.service.name).join(', ')}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''}`
      )

      contexts.push(`\n## Client: ${client.name}
- Total Proposals: ${clientProposals.length}
- Won Value: ${formatCurrency(wonValue)}
- Proposals:
${clientDetails.map((d) => `  • ${d}`).join('\n')}`)
      break
    }
  }

  // Specific service detection
  for (const service of allServices) {
    if (lower.includes(service.name.toLowerCase())) {
      const serviceProposals = await db.proposal.findMany({
        where: { services: { some: { serviceId: service.id } } },
        include: {
          client: { select: { name: true } },
          assignedMember: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })

      const wonValue = serviceProposals.filter((p) => p.status === 'Won').reduce((s, p) => s + p.value, 0)
      const statusBreakdown: Record<string, number> = {}
      for (const p of serviceProposals) {
        statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1
      }

      const serviceDetails = serviceProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | ${p.status} | ${formatCurrency(p.value)}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''}`
      )

      contexts.push(`\n## Service: ${service.name}
- Total Proposals: ${serviceProposals.length}
- Won Value: ${formatCurrency(wonValue)}
- Status Breakdown: ${Object.entries(statusBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Recent Proposals:
${serviceDetails.map((d) => `  • ${d}`).join('\n')}`)
      break
    }
  }

  // Specific status detection
  const statusKeywords: Record<string, string> = {
    submitted: 'Submitted',
    'in process': 'In Process',
    'in evaluation': 'In Evaluation',
    pending: 'Pending',
    won: 'Won',
    rejected: 'Rejected',
    lost: 'Rejected',
  }
  for (const [keyword, status] of Object.entries(statusKeywords)) {
    if (lower.includes(keyword) && !lower.includes('win rate') && !lower.includes('rate')) {
      const statusProposals = await db.proposal.findMany({
        where: { status },
        include: {
          client: { select: { name: true } },
          assignedMember: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      const totalValue = statusProposals.reduce((s, p) => s + p.value, 0)
      const statusDetails = statusProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | ${formatCurrency(p.value)} | Services: ${p.services.map((s) => s.service.name).join(', ')}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''} | Created: ${formatDate(new Date(p.createdAt))}`
      )

      contexts.push(`\n## Proposals with status "${status}":
- Count: ${statusProposals.length}
- Total Value: ${formatCurrency(totalValue)}
- Recent:
${statusDetails.map((d) => `  • ${d}`).join('\n')}`)
      break
    }
  }

  // Deadline / upcoming detection
  if (lower.includes('deadline') || lower.includes('upcoming') || lower.includes('due') || lower.includes('overdue')) {
    const now = new Date()

    if (lower.includes('overdue')) {
      const overdueProposals = await db.proposal.findMany({
        where: {
          deadline: { lt: now },
          status: { notIn: ['Won', 'Rejected'] },
        },
        include: {
          client: { select: { name: true } },
          assignedMember: { select: { name: true } },
        },
        orderBy: { deadline: 'asc' },
        take: 15,
      })

      const overdueDetails = overdueProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | Deadline was: ${formatDate(new Date(p.deadline!))} | ${p.status} | ${formatCurrency(p.value)}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''}`
      )

      contexts.push(`\n## Overdue Proposals:
- Count: ${overdueProposals.length}
${overdueDetails.map((d) => `  • ${d}`).join('\n')}`)
    } else {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingProposals = await db.proposal.findMany({
        where: {
          deadline: { gte: now, lte: sevenDaysLater },
          status: { notIn: ['Won', 'Rejected'] },
        },
        include: {
          client: { select: { name: true } },
          assignedMember: { select: { name: true } },
        },
        orderBy: { deadline: 'asc' },
        take: 15,
      })

      const upcomingDetails = upcomingProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | Deadline: ${formatDate(new Date(p.deadline!))} | ${p.status} | ${formatCurrency(p.value)}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''}`
      )

      contexts.push(`\n## Upcoming Deadlines (next 7 days):
- Count: ${upcomingProposals.length}
${upcomingDetails.map((d) => `  • ${d}`).join('\n')}`)
    }
  }

  // Thematic area detection
  for (const area of allThematicAreasForDetection) {
    if (lower.includes(area.name.toLowerCase()) || lower.includes('thematic')) {
      const areaProposals = await db.proposal.findMany({
        where: { thematicAreas: { some: { thematicAreaId: area.id } } },
        include: {
          client: { select: { name: true } },
          assignedMember: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })

      const wonValue = areaProposals.filter((p) => p.status === 'Won').reduce((s, p) => s + p.value, 0)
      const statusBreakdown: Record<string, number> = {}
      for (const p of areaProposals) {
        statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1
      }

      const areaDetails = areaProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | ${p.status} | ${formatCurrency(p.value)} | Services: ${p.services.map((s) => s.service.name).join(', ')}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''}`
      )

      contexts.push(`\n## Thematic Area: ${area.name}
- Total Proposals: ${areaProposals.length}
- Won Value: ${formatCurrency(wonValue)}
- Status Breakdown: ${Object.entries(statusBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Recent Proposals:
${areaDetails.map((d) => `  • ${d}`).join('\n')}`)
      break
    }
  }

  // Team member detection
  for (const member of allMembers) {
    if (lower.includes(member.name.toLowerCase())) {
      const memberProposals = await db.proposal.findMany({
        where: { assignedMemberId: member.id },
        include: {
          client: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      const wonCount = memberProposals.filter((p) => p.status === 'Won').length
      const wonValue = memberProposals.filter((p) => p.status === 'Won').reduce((s, p) => s + p.value, 0)
      const memberDetails = memberProposals.map(
        (p) =>
          `"${p.name}" for ${p.client.name} | ${p.status} | ${formatCurrency(p.value)} | Services: ${p.services.map((s) => s.service.name).join(', ')}`
      )

      contexts.push(`\n## Team Member: ${member.name}
- Total Assigned Proposals: ${memberProposals.length}
- Won: ${wonCount} (${formatCurrency(wonValue)})
- Proposals:
${memberDetails.map((d) => `  • ${d}`).join('\n')}`)
      break
    }
  }

  return { additionalContext: contexts.join('\n') }
}

// ─── API Routes ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const messages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.chatMessage.deleteMany()
    // Invalidate the summary cache on reset
    summaryCache = null
    return NextResponse.json({ success: true, message: 'Chat history cleared' })
  } catch (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json({ error: 'Failed to clear chat history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        role: 'user',
        content: message,
      },
    })

    // Get recent conversation context (limited to last 10 messages)
    const recentMessages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const conversationHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

    // Fetch real-time CRM summary data (with caching)
    const crmSummary = await fetchCRMSummary()

    // Detect specific query context and fetch relevant data
    const { additionalContext } = await detectAndFetchQueryContext(message)

    // Get company name from settings (retrieved during fetchCRMSummary, cached)
    const settings = await db.setting.findMany({ select: { key: true, value: true } })
    const companyName = settings.find(s => s.key === 'companyName')?.value || 'ECI CRM'

    // Build comprehensive system prompt
    const systemPrompt = `You are the AI assistant for ${companyName} CRM system. You have COMPLETE, REAL-TIME access to ALL CRM data — clients, proposals, services, thematic areas, team performance, business targets, resources, and historical trends. Your knowledge updates automatically as the CRM data changes.

## YOUR CAPABILITIES:
- Answer questions about ANY data in the CRM: proposals, clients, services, targets, deadlines, team performance, resources, thematic areas
- Provide historical comparisons (past years) and future projections (based on targets and current pace)
- Give strategic business insights and actionable recommendations
- Track pipeline status, win rates, and business progress
- Identify overdue proposals, upcoming deadlines, and at-risk deals

## RESPONSE RULES:
- ALWAYS use EXACT numbers from the data provided below — never estimate or guess
- Format currency as ₨ (Pakistani Rupee), e.g., ₨ 1,500,000
- Be concise but thorough — lead with key numbers, then provide context
- When asked about trends, compare current data with historical data provided
- When asked about the future, reference targets and project based on current pace
- If data isn't available for a specific question, say so clearly rather than making up information
- When comparing periods, use the data provided and note the time range
- For pipeline questions, reference Pipeline Value and status breakdowns
- Provide actionable insights (e.g., "You're 15% behind target — to catch up you need ₨ X per month")
- Always respond in a professional, helpful tone

## CURRENT CRM DATA (real-time, auto-updated):

${crmSummary}
${additionalContext}`

    // Use z-ai-web-dev-sdk LLM with retry logic
    const zai = await ZAI.create()

    let response
    let lastError: unknown = null

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...conversationHistory,
          ],
        })
        break // Success — exit retry loop
      } catch (sdkError) {
        lastError = sdkError
        console.error(`LLM SDK call failed (attempt ${attempt + 1}/2):`, sdkError)
        if (attempt === 0) {
          // Brief pause before retry
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    }

    if (!response) {
      console.error('LLM SDK call failed after 2 attempts:', lastError)
      // Save fallback response to DB so it persists in chat history
      const fallbackMessage = await db.chatMessage.create({
        data: {
          role: 'assistant',
          content: 'I\'m sorry, I\'m having trouble connecting to the AI service right now. Please try again in a moment. If the issue persists, contact your system administrator.',
        },
      })
      return NextResponse.json(fallbackMessage)
    }

    const assistantContent = response.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.'

    // Save assistant response
    const assistantMessage = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: assistantContent,
      },
    })

    return NextResponse.json(assistantMessage)
  } catch (error) {
    console.error('Error in chat:', error)
    // Save error fallback to DB so it persists in chat history
    try {
      const errorMessage = await db.chatMessage.create({
        data: {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again. If the issue persists, try clearing the chat history and starting fresh.',
        },
      })
      return NextResponse.json(errorMessage)
    } catch {
      return NextResponse.json({
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      })
    }
  }
}
