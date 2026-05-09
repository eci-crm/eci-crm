import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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

// ─── Fetch CRM Summary Data ──────────────────────────────────────────────────

async function fetchCRMSummary(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  // Client counts
  const totalClients = await db.client.count()
  const activeClients = await db.client.count({ where: { status: 'Active' } })
  const inactiveClients = await db.client.count({ where: { status: 'Inactive' } })

  // Proposal counts by status (all time)
  const statusOrder = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']
  const statusCounts: Record<string, number> = {}
  let totalProposals = 0
  for (const status of statusOrder) {
    const count = await db.proposal.count({ where: { status } })
    statusCounts[status] = count
    totalProposals += count
  }

  // Proposal counts by status (this year)
  const yearStatusCounts: Record<string, number> = {}
  let yearTotalProposals = 0
  for (const status of statusOrder) {
    const count = await db.proposal.count({
      where: { status, createdAt: { gte: yearStart, lte: yearEnd } },
    })
    yearStatusCounts[status] = count
    yearTotalProposals += count
  }

  // Total business (Won proposals this year)
  const wonProposalsThisYear = await db.proposal.findMany({
    where: { status: 'Won' },
    select: { value: true, createdAt: true, submissionDate: true },
  })

  let totalBusinessWon = 0
  for (const p of wonProposalsThisYear) {
    const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
    if (pDate >= yearStart && pDate <= yearEnd) {
      totalBusinessWon += p.value
    }
  }

  // Annual target
  const targets = await db.businessTarget.findMany({ where: { year } })
  const annualTargetRow = targets.find((t) => t.month === null)
  const annualTarget = annualTargetRow ? annualTargetRow.amount : targets.reduce((sum, t) => sum + t.amount, 0)
  const percentageAchieved = annualTarget > 0 ? Math.round((totalBusinessWon / annualTarget) * 100) : 0

  // Services summary
  const allServices = await db.service.findMany({ orderBy: { sortOrder: 'asc' } })
  const serviceLines: string[] = []
  for (const service of allServices) {
    const serviceProposals = await db.proposal.findMany({
      where: {
        services: { some: { serviceId: service.id } },
        status: 'Won',
      },
      select: { value: true, createdAt: true, submissionDate: true },
    })
    let wonValue = 0
    for (const p of serviceProposals) {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= yearStart && pDate <= yearEnd) {
        wonValue += p.value
      }
    }
    const totalCount = await db.proposal.count({
      where: { services: { some: { serviceId: service.id } } },
    })
    serviceLines.push(`  • ${service.name}: ${totalCount} proposals, Won value: ${formatCurrency(wonValue)}`)
  }

  // Top clients
  const allWonWithClient = await db.proposal.findMany({
    where: { status: 'Won' },
    select: {
      value: true,
      createdAt: true,
      submissionDate: true,
      clientId: true,
      client: { select: { name: true } },
    },
  })

  const clientWonMap: Record<string, { name: string; wonValue: number }> = {}
  for (const p of allWonWithClient) {
    const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
    if (pDate >= yearStart && pDate <= yearEnd) {
      if (!clientWonMap[p.clientId]) {
        clientWonMap[p.clientId] = { name: p.client.name, wonValue: 0 }
      }
      clientWonMap[p.clientId].wonValue += p.value
    }
  }

  const topClients = Object.values(clientWonMap)
    .sort((a, b) => b.wonValue - a.wonValue)
    .slice(0, 5)
    .map((c) => `  • ${c.name}: ${formatCurrency(c.wonValue)}`)

  // Team members performance
  const activeMembers = await db.teamMember.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
  })

  const allWonWithMember = await db.proposal.findMany({
    where: { status: 'Won', assignedMemberId: { not: null } },
    select: {
      value: true,
      createdAt: true,
      submissionDate: true,
      assignedMemberId: true,
    },
  })

  const teamLines: string[] = []
  for (const member of activeMembers) {
    let wonCount = 0
    let wonValue = 0
    for (const p of allWonWithMember) {
      if (p.assignedMemberId !== member.id) continue
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= yearStart && pDate <= yearEnd) {
        wonCount++
        wonValue += p.value
      }
    }
    teamLines.push(`  • ${member.name} (${member.role}): ${wonCount} won proposals, ${formatCurrency(wonValue)}`)
  }

  // Recent proposals (last 5)
  const recentProposals = await db.proposal.findMany({
    include: {
      client: { select: { name: true } },
      assignedMember: { select: { name: true } },
      services: { include: { service: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const recentLines = recentProposals.map(
    (p) =>
      `  • "${p.name}" for ${p.client.name} | Status: ${p.status} | Value: ${formatCurrency(p.value)}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''} | Services: ${p.services.map((s) => s.service.name).join(', ')} | Created: ${formatDate(new Date(p.createdAt))}`
  )

  // Upcoming deadlines (7 days)
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingDeadlines = await db.proposal.findMany({
    where: { deadline: { gte: now, lte: sevenDaysLater } },
    include: {
      client: { select: { name: true } },
      assignedMember: { select: { name: true } },
    },
    orderBy: { deadline: 'asc' },
    take: 10,
  })

  const deadlineLines = upcomingDeadlines.map(
    (p) =>
      `  • "${p.name}" for ${p.client.name} | Deadline: ${formatDate(new Date(p.deadline!))}${p.assignedMember ? ` | Assigned: ${p.assignedMember.name}` : ''} | Value: ${formatCurrency(p.value)}`
  )

  // New clients this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const newClientsThisMonth = await db.client.count({
    where: {
      createdAt: { gte: monthStart },
    },
  })

  // All proposals for pipeline stats
  const allProposalsForPipeline = await db.proposal.findMany({
    select: {
      value: true,
      status: true,
      createdAt: true,
      submissionDate: true,
      services: { select: { serviceId: true } },
    },
  })

  const proposalsInRange = allProposalsForPipeline.filter((p) => {
    const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
    return pDate >= yearStart && pDate <= yearEnd
  })

  const totalProposalValue = proposalsInRange.reduce((sum, p) => sum + p.value, 0)
  const proposalsInRangeCount = proposalsInRange.length

  // Win rate
  const wonCount = statusCounts['Won'] || 0
  const winRate = totalProposals > 0 ? Math.round((wonCount / totalProposals) * 100) : 0
  const yearWinRate = yearTotalProposals > 0 ? Math.round((yearStatusCounts['Won'] / yearTotalProposals) * 100) : 0

  // Thematic Areas summary
  const allThematicAreas = await db.thematicArea.findMany({ orderBy: { sortOrder: 'asc' } })
  const thematicLines: string[] = []
  for (const area of allThematicAreas) {
    const areaProposals = await db.proposal.findMany({
      where: {
        thematicAreas: { some: { thematicAreaId: area.id } },
      },
      select: { value: true, status: true, createdAt: true, submissionDate: true },
    })
    const wonValue = areaProposals
      .filter((p) => p.status === 'Won')
      .reduce((sum, p) => {
        const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
        return pDate >= yearStart && pDate <= yearEnd ? sum + p.value : sum
      }, 0)
    const totalCount = areaProposals.length
    const statusBreakdown: Record<string, number> = {}
    for (const p of areaProposals) {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1
    }
    thematicLines.push(`  • ${area.name}: ${totalCount} proposals, Won value: ${formatCurrency(wonValue)}, Status: ${Object.entries(statusBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
  }

  // Monthly breakdown of won proposals
  const monthlyBreakdown: string[] = []
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(year, m, 1)
    const mEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)
    const monthWon = await db.proposal.findMany({
      where: { status: 'Won' },
      select: { value: true, createdAt: true, submissionDate: true },
    })
    let mValue = 0
    for (const p of monthWon) {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= mStart && pDate <= mEnd) {
        mValue += p.value
      }
    }
    if (mValue > 0) {
      monthlyBreakdown.push(`  • ${MONTH_NAMES[m]}: ${formatCurrency(mValue)}`)
    }
  }

  // Quarterly breakdown
  const quarterlyBreakdown: string[] = []
  for (let q = 1; q <= 4; q++) {
    const startMonth = (q - 1) * 3
    const qStart = new Date(year, startMonth, 1)
    const qEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
    const qWon = await db.proposal.findMany({
      where: { status: 'Won' },
      select: { value: true, createdAt: true, submissionDate: true },
    })
    let qValue = 0
    for (const p of qWon) {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= qStart && pDate <= qEnd) {
        qValue += p.value
      }
    }
    quarterlyBreakdown.push(`  • Q${q}: ${formatCurrency(qValue)}`)
  }

  // Pipeline stats
  const pipelineValue = allProposalsForPipeline
    .filter((p) => p.status !== 'Won' && p.status !== 'Rejected')
    .reduce((sum, p) => sum + p.value, 0)
  const avgProposalValue = proposalsInRangeCount > 0 ? Math.round(totalProposalValue / proposalsInRangeCount) : 0

  // Build the summary
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
${deadlineLines.join('\n') || '  No upcoming deadlines in the next 7 days'}`

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

  // Specific client detection
  const allClients = await db.client.findMany({ select: { id: true, name: true } })
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
  const allServices = await db.service.findMany({ select: { id: true, name: true } })
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
  const allThematicAreasForDetection = await db.thematicArea.findMany({ select: { id: true, name: true } })
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
  const allMembers = await db.teamMember.findMany({ where: { isActive: true }, select: { id: true, name: true } })
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

    // Get recent conversation context
    const recentMessages = await db.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const conversationHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

    // Fetch real-time CRM summary data
    const crmSummary = await fetchCRMSummary()

    // Detect specific query context and fetch relevant data
    const { additionalContext } = await detectAndFetchQueryContext(message)

    // Build comprehensive system prompt
    const systemPrompt = `You are a CRM assistant for CRM Pro. You have access to the following REAL-TIME CRM data. When users ask about CRM data, provide EXACT numbers from this data. Be concise and helpful. Format currency as ₨ (Pakistani Rupee). If the data shows a specific number, use that exact number in your response. If you're unsure or the data isn't available, say so clearly.

${crmSummary}
${additionalContext}

Important guidelines:
- Always use EXACT numbers from the data above when answering questions
- Format all currency amounts as ₨ (Pakistani Rupee), e.g., ₨ 1,500,000
- When asked about win rate, calculate: (Won proposals / Total proposals) × 100
- When asked about progress toward target, use the target and actual values shown
- If the user asks about a specific time period, client, service, thematic area, or team member, check the additional context above for specific data
- When asked about monthly or quarterly performance, refer to the Monthly Business Breakdown and Quarterly Breakdown sections above
- When asked about thematic areas, check the Thematic Areas section for detailed information
- Be concise but thorough — give the key numbers first, then brief context
- If the user asks something not covered by the data, let them know you can help with CRM-related queries about proposals, clients, services, targets, thematic areas, team performance, and business analytics
- When comparing periods, use the data provided and note the time range
- For pipeline-related questions, reference the Pipeline Value and status breakdowns`

    // Use z-ai-web-dev-sdk LLM
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory,
      ],
    })

    const assistantContent = response.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.'

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
    // Return a fallback response so the UI doesn't break
    const fallbackMessage = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
      },
    })
    return NextResponse.json(fallbackMessage)
  }
}
