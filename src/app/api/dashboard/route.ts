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
  const year = yearParam ? parseInt(yearParam) : 2025

  let startDate: Date
  let endDate: Date

  if (startDateStr && endDateStr) {
    startDate = new Date(startDateStr)
    endDate = new Date(endDateStr)
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

    // Client counts
    const totalClients = await db.client.count()
    const activeClients = await db.client.count({ where: { status: 'Active' } })
    const inactiveClients = await db.client.count({ where: { status: 'Inactive' } })

    // Proposal counts
    const totalProposals = await db.proposal.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    const proposalsByStatus = await db.proposal.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { status: true },
    })

    const proposalCountsByStatus: Record<string, number> = {}
    for (const item of proposalsByStatus) {
      proposalCountsByStatus[item.status] = item._count.status
    }

    // Total business (won proposals) - use submissionDate for business tracking
    const wonProposals = await db.proposal.findMany({
      where: {
        status: 'Won',
      },
      select: { value: true, createdAt: true, submissionDate: true, services: { include: { service: true } } },
    })

    let totalBusiness = 0
    for (const p of wonProposals) {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= startDate && pDate <= endDate) {
        if (serviceId) {
          if (p.services.some((s) => s.serviceId === serviceId)) {
            totalBusiness += p.value
          }
        } else {
          totalBusiness += p.value
        }
      }
    }

    // Targets
    const targetWhere: Record<string, unknown> = { year }
    if (serviceId) targetWhere.serviceId = serviceId

    const targets = await db.businessTarget.findMany({ where: targetWhere })

    // Annual target - must be calculated before monthly/quarterly loops that reference it
    const annualTargetRow = targets.find((t) => t.month === null)
    const annualTarget = annualTargetRow ? annualTargetRow.amount : targets.reduce((sum, t) => sum + t.amount, 0)
    const annualActual = totalBusiness

    // Monthly progress
    const monthlyProgress = []
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1)
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

      const monthTargets = targets.filter((t) => t.month === m + 1)
      const monthTargetAmount = monthTargets.length > 0
        ? monthTargets.reduce((sum, t) => sum + t.amount, 0)
        : (annualTarget > 0 ? Math.round(annualTarget / 12) : 0)

      const monthWonProposals = await db.proposal.findMany({
        where: {
          status: 'Won',
        },
        select: { value: true, createdAt: true, submissionDate: true, services: { select: { serviceId: true } } },
      })

      let monthActual = 0
      for (const p of monthWonProposals) {
        const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
        if (pDate >= monthStart && pDate <= monthEnd) {
          if (serviceId) {
            if (p.services.some((s) => s.serviceId === serviceId)) {
              monthActual += p.value
            }
          } else {
            monthActual += p.value
          }
        }
      }

      monthlyProgress.push({
        month: MONTH_NAMES[m],
        target: monthTargetAmount,
        actual: monthActual,
      })
    }

    // Quarterly progress
    const quarterlyProgress = []
    for (let q = 1; q <= 4; q++) {
      const startMonth = (q - 1) * 3
      const qStart = new Date(year, startMonth, 1)
      const qEnd = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)

      const qTargets = targets.filter((t) => t.month !== null && getQuarter(t.month - 1) === q)
      const qTargetAmount = qTargets.length > 0
        ? qTargets.reduce((sum, t) => sum + t.amount, 0)
        : (annualTarget > 0 ? Math.round(annualTarget / 4) : 0)

      const qWonProposals = await db.proposal.findMany({
        where: {
          status: 'Won',
        },
        select: { value: true, createdAt: true, submissionDate: true, services: { select: { serviceId: true } } },
      })

      let qActual = 0
      for (const p of qWonProposals) {
        const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
        if (pDate >= qStart && pDate <= qEnd) {
          if (serviceId) {
            if (p.services.some((s) => s.serviceId === serviceId)) {
              qActual += p.value
            }
          } else {
            qActual += p.value
          }
        }
      }

      quarterlyProgress.push({
        quarter: `Q${q}`,
        target: qTargetAmount,
        actual: qActual,
      })
    }

    // Target vs actual
    const overallTarget = annualTarget
    const overallActual = annualActual
    const percentageAchieved = overallTarget > 0 ? Math.round((overallActual / overallTarget) * 100) : 0
    const remaining = Math.max(0, overallTarget - overallActual)

    // Service-wise summary
    const allServices = await db.service.findMany({ orderBy: { sortOrder: 'asc' } })
    const serviceWiseSummary = []

    for (const service of allServices) {
      const serviceProposals = await db.proposal.findMany({
        where: {
          services: { some: { serviceId: service.id } },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { value: true, status: true },
      })

      const totalValue = serviceProposals.reduce((sum, p) => sum + p.value, 0)
      const wonValue = serviceProposals
        .filter((p) => p.status === 'Won')
        .reduce((sum, p) => sum + p.value, 0)

      serviceWiseSummary.push({
        service: { id: service.id, name: service.name, color: service.color },
        proposals: serviceProposals.length,
        totalValue,
        wonValue,
      })
    }

    // Proposal status summary
    const statusOrder = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']
    const proposalStatusSummary: Record<string, number> = {}
    for (const status of statusOrder) {
      const count = await db.proposal.count({
        where: {
          status,
          createdAt: { gte: startDate, lte: endDate },
        },
      })
      proposalStatusSummary[status] = count
    }

    // Upcoming deadlines (7 days)
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

    // Recent proposals
    const recentProposals = await db.proposal.findMany({
      include: {
        client: true,
        assignedMember: true,
        thematicAreas: { include: { thematicArea: true } },
        services: { include: { service: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // ─── NEW: Client Analytics ───────────────────────────────────────────
    // Top 5 clients by won business value (using submissionDate like totalBusiness)
    const allWonProposalsWithClient = await db.proposal.findMany({
      where: {
        status: 'Won',
      },
      select: {
        value: true,
        createdAt: true,
        submissionDate: true,
        clientId: true,
        client: { select: { id: true, name: true, status: true } },
        services: { select: { serviceId: true } },
      },
    })

    // Aggregate won value per client (filtered by date range using submissionDate)
    const clientWonMap: Record<string, { id: string; name: string; status: string; wonValue: number }> = {}
    for (const p of allWonProposalsWithClient) {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate >= startDate && pDate <= endDate) {
        if (serviceId && !p.services.some((s) => s.serviceId === serviceId)) continue
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

    // ─── NEW: Team Performance ───────────────────────────────────────────
    const allTeamMembers = await db.teamMember.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    })

    // Get all won proposals with assignedMember for the period
    const allWonWithMember = await db.proposal.findMany({
      where: {
        status: 'Won',
        assignedMemberId: { not: null },
      },
      select: {
        value: true,
        createdAt: true,
        submissionDate: true,
        assignedMemberId: true,
        services: { select: { serviceId: true } },
      },
    })

    const teamPerformanceData = []
    for (const member of allTeamMembers) {
      let wonCount = 0
      let wonValue = 0

      for (const p of allWonWithMember) {
        if (p.assignedMemberId !== member.id) continue
        const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
        if (pDate >= startDate && pDate <= endDate) {
          if (serviceId && !p.services.some((s) => s.serviceId === serviceId)) continue
          wonCount++
          wonValue += p.value
        }
      }

      teamPerformanceData.push({
        id: member.id,
        name: member.name,
        role: member.role,
        wonProposals: wonCount,
        wonValue,
      })
    }

    // Sort by wonValue descending
    teamPerformanceData.sort((a, b) => b.wonValue - a.wonValue)

    const teamPerformance = teamPerformanceData

    // ─── NEW: Pipeline Stats ─────────────────────────────────────────────
    // All proposals in date range (using submissionDate or createdAt)
    const allProposalsForPipeline = await db.proposal.findMany({
      select: {
        value: true,
        status: true,
        createdAt: true,
        submissionDate: true,
        services: { select: { serviceId: true } },
      },
    })

    // Filter by date range using submissionDate (same logic as totalBusiness)
    const proposalsInRange = allProposalsForPipeline.filter((p) => {
      const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
      if (pDate < startDate || pDate > endDate) return false
      if (serviceId && !p.services.some((s) => s.serviceId === serviceId)) return false
      return true
    })

    const totalProposalValue = proposalsInRange.reduce((sum, p) => sum + p.value, 0)
    const proposalsInRangeCount = proposalsInRange.length
    const averageProposalValue = proposalsInRangeCount > 0 ? Math.round(totalProposalValue / proposalsInRangeCount) : 0

    // Conversion rate: Won / Total * 100
    const wonInPeriod = proposalsInRange.filter((p) => p.status === 'Won').length
    const conversionRate = proposalsInRangeCount > 0 ? Math.round((wonInPeriod / proposalsInRangeCount) * 100) : 0

    // Average days to win (from submission to won - use createdAt as proxy if submissionDate is null)
    // Since we don't track "won date", use submissionDate as the date and createdAt as start
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

    // Pipeline value: sum of non-Won proposals
    const pipelineValue = proposalsInRange
      .filter((p) => p.status !== 'Won')
      .reduce((sum, p) => sum + p.value, 0)

    const pipelineStats = {
      averageProposalValue,
      conversionRate,
      avgDaysToWin,
      pipelineValue,
    }

    // ─── NEW: Monthly Revenue Trend (12 months) ─────────────────────────
    const monthlyRevenueTrend = []
    for (let m = 0; m < 12; m++) {
      const mStart = new Date(year, m, 1)
      const mEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

      const monthWonAll = await db.proposal.findMany({
        where: {
          status: 'Won',
        },
        select: { value: true, createdAt: true, submissionDate: true, services: { select: { serviceId: true } } },
      })

      let mRevenue = 0
      for (const p of monthWonAll) {
        const pDate = p.submissionDate ? new Date(p.submissionDate) : new Date(p.createdAt)
        if (pDate >= mStart && pDate <= mEnd) {
          if (serviceId) {
            if (p.services.some((s) => s.serviceId === serviceId)) {
              mRevenue += p.value
            }
          } else {
            mRevenue += p.value
          }
        }
      }

      monthlyRevenueTrend.push({
        month: MONTH_NAMES[m],
        revenue: mRevenue,
      })
    }

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
      // New data
      clientAnalytics,
      teamPerformance,
      pipelineStats,
      monthlyRevenueTrend,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
