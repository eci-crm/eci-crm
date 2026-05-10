import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getQuarter(month: number): number {
  if (month <= 2) return 1
  if (month <= 5) return 2
  if (month <= 8) return 3
  return 4
}

function getDateRange(params: URLSearchParams) {
  const serviceId = params.get('serviceId')
  const startDateStr = params.get('startDate')
  const endDateStr = params.get('endDate')
  const monthParam = params.get('month')
  const quarterParam = params.get('quarter')
  const yearParam = params.get('year')

  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()

  let startDate: Date
  let endDate: Date

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr)
    endDate = new Date(endDateStr)
    // Ensure endDate covers the full day
    endDate.setHours(23, 59, 59, 999)
  } else if (monthParam !== null) {
    const month = parseInt(monthParam)
    startDate = new Date(year, month, 1)
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
  } else if (quarterParam !== null) {
    const quarter = parseInt(quarterParam)
    const startMonth = (quarter - 1) * 3
    startDate = new Date(year, startMonth, 1)
    endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
  } else {
    startDate = new Date(year, 0, 1)
    endDate = new Date(year, 11, 31, 23, 59, 59, 999)
  }

  return { startDate, endDate, serviceId, year }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { startDate, endDate, serviceId, year } = getDateRange(searchParams)

    // ─── Get available years from database ─────────────────────────────────
    const currentYear = new Date().getFullYear()

    // Get distinct years from BusinessTarget
    const targetYears = await db.businessTarget.findMany({
      select: { year: true },
      distinct: ['year'],
    })

    // Get distinct years from Proposal createdAt
    const proposals = await db.proposal.findMany({
      select: { createdAt: true },
    })
    const proposalYears = new Set<number>()
    for (const p of proposals) {
      proposalYears.add(new Date(p.createdAt).getFullYear())
    }

    // Combine all years and current year
    const yearSet = new Set<number>([currentYear])
    for (const t of targetYears) {
      yearSet.add(t.year)
    }
    for (const y of proposalYears) {
      yearSet.add(y)
    }
    const availableYears = Array.from(yearSet).sort((a, b) => a - b)

    // ─── Build database-level filter for date range and service ──────────
    const whereClause: Record<string, unknown> = {}
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) (whereClause.createdAt as Record<string, unknown>).gte = startDate
      if (endDate) (whereClause.createdAt as Record<string, unknown>).lte = endDate
    }
    if (serviceId) {
      whereClause.services = { some: { serviceId } }
    }

    // ─── Fetch filtered proposals with related data ─────────────────────
    const proposalsInRange = await db.proposal.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, status: true } },
        assignedMember: { select: { id: true, name: true, role: true } },
        thematicAreas: { include: { thematicArea: true } },
        services: { include: { service: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ─── Helper: get the business date for a proposal (for revenue/won calculations by month/quarter) ─
    function getBusinessDate(p: { createdAt: Date; submissionDate: Date | null }): Date {
      return p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
    }

    // ─── Client counts ─────────────────────────────────────────────────
    const totalClients = await db.client.count()
    const activeClients = await db.client.count({ where: { status: 'Active' } })
    const inactiveClients = await db.client.count({ where: { status: 'Inactive' } })

    // ─── Proposal counts (filtered by date range) ─────────────────────
    const totalProposals = proposalsInRange.length

    const proposalCountsByStatus: Record<string, number> = {}
    for (const p of proposalsInRange) {
      proposalCountsByStatus[p.status] = (proposalCountsByStatus[p.status] || 0) + 1
    }

    // ─── Total business (won proposals within date range) ──────────────
    const wonProposalsInRange = proposalsInRange.filter((p) => p.status === 'Won')
    const totalBusiness = wonProposalsInRange.reduce((sum, p) => sum + p.value, 0)

    // ─── Targets ─────────────────────────────────────────────────────
    const targetWhere: Record<string, unknown> = { year }
    if (serviceId) targetWhere.serviceId = serviceId

    const targets = await db.businessTarget.findMany({ where: targetWhere })

    // Annual target
    const annualTargetRow = targets.find((t) => t.month === null)
    const annualTarget = annualTargetRow ? annualTargetRow.amount : targets.reduce((sum, t) => sum + t.amount, 0)

    // ─── Pro-rate target for sub-year periods ─────────────────────────
    // Calculate what proportion of the year the date range covers
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)
    const totalYearMs = yearEnd.getTime() - yearStart.getTime()
    const rangeMs = endDate.getTime() - startDate.getTime()
    const yearProportion = totalYearMs > 0 ? Math.min(rangeMs / totalYearMs, 1) : 1

    // Pro-rated target based on the selected date range
    const periodTarget = Math.round(annualTarget * yearProportion)
    const annualActual = totalBusiness

    // ─── Monthly progress (filtered by date range) ────────────────────
    const monthlyProgress = []
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1)
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

      // Check if this month overlaps with the selected date range
      if (monthEnd < startDate || monthStart > endDate) continue

      const monthTargets = targets.filter((t) => t.month === m + 1)
      const monthTargetAmount = monthTargets.length > 0
        ? monthTargets.reduce((sum, t) => sum + t.amount, 0)
        : (annualTarget > 0 ? Math.round(annualTarget / 12) : 0)

      const monthWon = wonProposalsInRange.filter((p) => {
        const pDate = getBusinessDate(p)
        return pDate >= monthStart && pDate <= monthEnd
      })
      const monthActual = monthWon.reduce((sum, p) => sum + p.value, 0)

      monthlyProgress.push({
        month: MONTH_NAMES[m],
        target: monthTargetAmount,
        actual: monthActual,
      })
    }

    // ─── Quarterly progress (filtered by date range) ──────────────────
    const quarterlyProgress = []
    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3
      const qStart = new Date(year, startMonth, 1)
      const qEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)

      // Check if this quarter overlaps with the selected date range
      if (qEnd < startDate || qStart > endDate) continue

      const qTargets = targets.filter((t) => t.month !== null && getQuarter(t.month - 1) === q)
      const qTargetAmount = qTargets.length > 0
        ? qTargets.reduce((sum, t) => sum + t.amount, 0)
        : (annualTarget > 0 ? Math.round(annualTarget / 4) : 0)

      const qWon = wonProposalsInRange.filter((p) => {
        const pDate = getBusinessDate(p)
        return pDate >= qStart && pDate <= qEnd
      })
      const qActual = qWon.reduce((sum, p) => sum + p.value, 0)

      quarterlyProgress.push({
        quarter: `Q${q}`,
        target: qTargetAmount,
        actual: qActual,
      })
    }

    // ─── Target vs actual (using pro-rated target) ──────────────────
    const overallTarget = periodTarget
    const overallActual = annualActual
    const percentageAchieved = overallTarget > 0 ? Math.round((overallActual / overallTarget) * 100) : 0
    const remaining = Math.max(0, overallTarget - overallActual)

    // ─── Service-wise summary (filtered by date range) ────────────────
    const allServices = await db.service.findMany({ orderBy: { sortOrder: 'asc' } })
    const serviceWiseSummary = []

    for (const service of allServices) {
      const serviceProposalsInRange = proposalsInRange.filter((p) =>
        p.services.some((s) => s.serviceId === service.id)
      )

      const totalValue = serviceProposalsInRange.reduce((sum, p) => sum + p.value, 0)
      const wonValue = serviceProposalsInRange
        .filter((p) => p.status === 'Won')
        .reduce((sum, p) => sum + p.value, 0)

      serviceWiseSummary.push({
        service: { id: service.id, name: service.name, color: service.color },
        proposals: serviceProposalsInRange.length,
        totalValue,
        wonValue,
      })
    }

    // ─── Proposal status summary (filtered by date range) ────────────
    const statusOrder = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']
    const proposalStatusSummary: Record<string, number> = {}
    for (const status of statusOrder) {
      proposalStatusSummary[status] = proposalsInRange.filter((p) => p.status === status).length
    }

    // ─── Upcoming deadlines (7 days — always from now, not filtered by date range) ─
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingDeadlines = await db.proposal.findMany({
      where: {
        deadline: { gte: now, lte: sevenDaysLater },
      },
      include: {
        client: true,
        assignedMember: true,
      },
      orderBy: { deadline: 'asc' },
      take: 10,
    })

    // ─── Recent proposals (filtered by date range) ───────────────────
    const recentProposals = proposalsInRange.slice(0, 5)

    // ─── Client Analytics (filtered by date range) ────────────────────
    const clientWonMap: Record<string, { id: string; name: string; status: string; wonValue: number }> = {}
    for (const p of wonProposalsInRange) {
      if (!clientWonMap[p.clientId]) {
        clientWonMap[p.clientId] = {
          id: p.client.id,
          name: p.client.name,
          status: p.client.status,
          wonValue: 0,
        }
      }
      clientWonMap[p.clientId].wonValue += p.value
    }

    const topClients = Object.values(clientWonMap)
      .sort((a, b) => b.wonValue - a.wonValue)
      .slice(0, 5)

    // New clients this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newClientsThisMonth = await db.client.count({
      where: {
        createdAt: { gte: monthStart },
      },
    })

    const clientAnalytics = {
      topClients,
      activeClients,
      inactiveClients,
      newClientsThisMonth,
    }

    // ─── Team Performance (filtered by date range) ──────────────────
    const allTeamMembers = await db.teamMember.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    })

    const teamPerformanceData = []
    for (const member of allTeamMembers) {
      const memberWonProposals = wonProposalsInRange.filter(
        (p) => p.assignedMemberId === member.id
      )
      const wonCount = memberWonProposals.length
      const wonValue = memberWonProposals.reduce((sum, p) => sum + p.value, 0)

      teamPerformanceData.push({
        id: member.id,
        name: member.name,
        role: member.role,
        wonProposals: wonCount,
        wonValue,
      })
    }

    teamPerformanceData.sort((a, b) => b.wonValue - a.wonValue)
    const teamPerformance = teamPerformanceData

    // ─── Pipeline Stats (filtered by date range) ────────────────────
    const totalProposalValue = proposalsInRange.reduce((sum, p) => sum + p.value, 0)
    const proposalsInRangeCount = proposalsInRange.length
    const averageProposalValue = proposalsInRangeCount > 0 ? Math.round(totalProposalValue / proposalsInRangeCount) : 0

    const wonInPeriod = proposalsInRange.filter((p) => p.status === 'Won').length
    const conversionRate = proposalsInRangeCount > 0 ? Math.round((wonInPeriod / proposalsInRangeCount) * 100) : 0

    const wonWithDates = proposalsInRange.filter(
      (p) => p.status === 'Won' && p.submissionDate
    )
    let avgDaysToWin = 0
    if (wonWithDates.length > 0) {
      const totalDays = wonWithDates.reduce((sum, p) => {
        const start = new Date(p.createdAt)
        const end = new Date(p.submissionDate!)
        const diff = Math.abs(end.getTime() - start.getTime())
        return sum + Math.ceil(diff / (1000 * 60 * 60 * 24))
      }, 0)
      avgDaysToWin = Math.round(totalDays / wonWithDates.length)
    }

    const pipelineValue = proposalsInRange
      .filter((p) => p.status !== 'Won' && p.status !== 'Rejected')
      .reduce((sum, p) => sum + p.value, 0)

    const pipelineStats = {
      averageProposalValue,
      conversionRate,
      avgDaysToWin,
      pipelineValue,
    }

    // ─── Monthly Revenue Trend (filtered by date range) ─────────────
    const monthlyRevenueTrend = []
    for (let m = 0; m < 12; m++) {
      const mStart = new Date(year, m, 1)
      const mEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

      // Only include months that overlap with the selected date range
      if (mEnd < startDate || mStart > endDate) continue

      const mWon = wonProposalsInRange.filter((p) => {
        const pDate = getBusinessDate(p)
        return pDate >= mStart && pDate <= mEnd
      })
      const mRevenue = mWon.reduce((sum, p) => sum + p.value, 0)

      monthlyRevenueTrend.push({
        month: MONTH_NAMES[m],
        revenue: mRevenue,
      })
    }

    // ─── Period label for the frontend ──────────────────────────────
    const isFullYear = startDate.getTime() === new Date(year, 0, 1).getTime() &&
      endDate.getTime() === new Date(year, 11, 31, 23, 59, 59, 999).getTime()

    return NextResponse.json({
      clientCounts: {
        total: totalClients,
        active: activeClients,
        inactive: inactiveClients,
      },
      proposalCounts: {
        total: totalProposals,
        byStatus: proposalCountsByStatus,
      },
      totalBusiness,
      targetVsActual: {
        target: overallTarget,
        actual: overallActual,
        percentageAchieved,
        remaining,
      },
      monthlyProgress,
      quarterlyProgress,
      annualProgress: {
        target: annualTarget,
        actual: annualActual,
      },
      serviceWiseSummary,
      proposalStatusSummary,
      upcomingDeadlines,
      recentProposals,
      clientAnalytics,
      teamPerformance,
      pipelineStats,
      monthlyRevenueTrend,
      availableYears,
      periodInfo: {
        isFullYear,
        periodTarget,
        annualTarget,
        yearProportion: Math.round(yearProportion * 100),
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
