import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getQuarter(month: number): number {
  if (month <= 2) return 1
  if (month <= 5) return 2
  if (month <= 8) return 3
  return 4
}

function getFilterDates(params: URLSearchParams) {
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

  return { startDate, endDate, year }
}

async function getAvailableYears(): Promise<number[]> {
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
  return Array.from(yearSet).sort((a, b) => a - b)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const serviceId = searchParams.get('serviceId')
    const clientId = searchParams.get('clientId')
    const thematicAreaId = searchParams.get('thematicAreaId')
    const { startDate, endDate, year } = getFilterDates(searchParams)

    // Fetch available years in parallel with the report
    const availableYears = await getAvailableYears()

    switch (type) {
      case 'clients':
        return await handleClientsReport(startDate, endDate, clientId, availableYears)
      case 'proposals':
        return await handleProposalsReport(startDate, endDate, serviceId, clientId, thematicAreaId, availableYears)
      case 'summary':
        return await handleSummaryReport(startDate, endDate, year, serviceId, clientId, thematicAreaId, availableYears)
      case 'thematic':
        return await handleThematicReport(startDate, endDate, serviceId, clientId, thematicAreaId, availableYears)
      case 'service':
        return await handleServiceReport(startDate, endDate, year, clientId, thematicAreaId, availableYears)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

async function handleClientsReport(startDate: Date, endDate: Date, clientId: string | null, availableYears: number[]) {
  const where: Record<string, unknown> = {}
  if (clientId) {
    where.id = clientId
  }

  const clients = await db.client.findMany({
    where,
    include: {
      proposals: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          value: true,
          status: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const report = clients.map((client) => ({
    id: client.id,
    name: client.name,
    status: client.status,
    totalProposals: client.proposals.length,
    totalValue: client.proposals.reduce((sum, p) => sum + p.value, 0),
    wonValue: client.proposals
      .filter((p) => p.status === 'Won')
      .reduce((sum, p) => sum + p.value, 0),
  }))

  return NextResponse.json({ type: 'clients', data: report, availableYears })
}

async function handleProposalsReport(startDate: Date, endDate: Date, serviceId: string | null, clientId: string | null, thematicAreaId: string | null, availableYears: number[]) {
  const where: Record<string, unknown> = {
    createdAt: { gte: startDate, lte: endDate },
  }

  if (serviceId) {
    where.services = { some: { serviceId } }
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (thematicAreaId) {
    where.thematicAreas = { some: { thematicAreaId } }
  }

  const proposals = await db.proposal.findMany({
    where,
    include: {
      client: true,
      assignedMember: true,
      thematicAreas: { include: { thematicArea: true } },
      services: { include: { service: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusBreakdown: Record<string, { count: number; value: number }> = {}
  for (const p of proposals) {
    if (!statusBreakdown[p.status]) {
      statusBreakdown[p.status] = { count: 0, value: 0 }
    }
    statusBreakdown[p.status].count++
    statusBreakdown[p.status].value += p.value
  }

  return NextResponse.json({
    type: 'proposals',
    data: proposals,
    summary: {
      totalProposals: proposals.length,
      totalValue: proposals.reduce((sum, p) => sum + p.value, 0),
      wonValue: proposals.filter((p) => p.status === 'Won').reduce((sum, p) => sum + p.value, 0),
      statusBreakdown,
    },
    availableYears,
  })
}

async function handleSummaryReport(startDate: Date, endDate: Date, year: number, serviceId: string | null, clientId: string | null, thematicAreaId: string | null, availableYears: number[]) {
  // Client summary
  const clientWhere: Record<string, unknown> = {}
  if (clientId) {
    clientWhere.id = clientId
  }
  const totalClients = await db.client.count({ where: clientWhere })
  const activeClients = await db.client.count({ where: { ...clientWhere, status: 'Active' } })

  // Proposal summary
  const proposalWhere: Record<string, unknown> = {
    createdAt: { gte: startDate, lte: endDate },
  }
  if (clientId) {
    proposalWhere.clientId = clientId
  }
  if (thematicAreaId) {
    proposalWhere.thematicAreas = { some: { thematicAreaId } }
  }

  const totalProposals = await db.proposal.count({ where: proposalWhere })
  const wonProposals = await db.proposal.findMany({
    where: { ...proposalWhere, status: 'Won' },
    select: { value: true, services: { select: { serviceId: true } } },
  })

  let totalWonValue = 0
  for (const p of wonProposals) {
    if (serviceId) {
      if (p.services.some((s) => s.serviceId === serviceId)) {
        totalWonValue += p.value
      }
    } else {
      totalWonValue += p.value
    }
  }

  // Target summary
  const targetWhere: Record<string, unknown> = { year }
  if (serviceId) targetWhere.serviceId = serviceId
  const targets = await db.businessTarget.findMany({ where: targetWhere })
  const totalTarget = targets.reduce((sum, t) => sum + t.amount, 0)

  // Monthly breakdown
  const monthlyBreakdown = []
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1)
    const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

    const monthTarget = targets
      .filter((t) => t.month === m + 1)
      .reduce((sum, t) => sum + t.amount, 0)

    const monthProposalWhere: Record<string, unknown> = {
      status: 'Won',
      createdAt: { gte: monthStart, lte: monthEnd },
    }
    if (clientId) {
      monthProposalWhere.clientId = clientId
    }
    if (thematicAreaId) {
      monthProposalWhere.thematicAreas = { some: { thematicAreaId } }
    }

    const monthWon = await db.proposal.findMany({
      where: monthProposalWhere,
      select: { value: true, services: { select: { serviceId: true } } },
    })

    let monthActual = 0
    for (const p of monthWon) {
      if (serviceId) {
        if (p.services.some((s) => s.serviceId === serviceId)) {
          monthActual += p.value
        }
      } else {
        monthActual += p.value
      }
    }

    monthlyBreakdown.push({
      month: MONTH_NAMES[m],
      target: monthTarget,
      actual: monthActual,
    })
  }

  return NextResponse.json({
    type: 'summary',
    data: {
      totalClients,
      activeClients,
      totalProposals,
      totalWonValue,
      totalTarget,
      achievementPercentage: totalTarget > 0 ? Math.round((totalWonValue / totalTarget) * 100) : 0,
      monthlyBreakdown,
    },
    availableYears,
  })
}

async function handleThematicReport(startDate: Date, endDate: Date, serviceId: string | null, clientId: string | null, thematicAreaId: string | null, availableYears: number[]) {
  const where: Record<string, unknown> = {}
  if (thematicAreaId) {
    where.id = thematicAreaId
  }

  const areas = await db.thematicArea.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      proposals: {
        include: {
          proposal: {
            include: {
              client: true,
              services: { include: { service: true } },
            },
          },
        },
      },
    },
  })

  const report = areas.map((area) => {
    const filteredProposals = area.proposals.filter((pt) => {
      const p = pt.proposal
      const pDate = new Date(p.createdAt)
      const inDateRange = pDate >= startDate && pDate <= endDate
      const matchesService = !serviceId || p.services.some((s) => s.serviceId === serviceId)
      const matchesClient = !clientId || p.clientId === clientId
      return inDateRange && matchesService && matchesClient
    })

    const proposals = filteredProposals.map((pt) => pt.proposal)

    return {
      id: area.id,
      name: area.name,
      color: area.color,
      proposalCount: proposals.length,
      totalValue: proposals.reduce((sum, p) => sum + p.value, 0),
      wonValue: proposals
        .filter((p) => p.status === 'Won')
        .reduce((sum, p) => sum + p.value, 0),
      proposals: proposals.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        value: p.value,
        client: p.client,
      })),
    }
  })

  return NextResponse.json({ type: 'thematic', data: report, availableYears })
}

async function handleServiceReport(startDate: Date, endDate: Date, year: number, clientId: string | null, thematicAreaId: string | null, availableYears: number[]) {
  const services = await db.service.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      proposals: {
        include: {
          proposal: {
            include: {
              client: true,
              thematicAreas: { include: { thematicArea: true } },
            },
          },
        },
      },
    },
  })

  // Fetch targets for the given year
  const targets = await db.businessTarget.findMany({
    where: { year },
  })

  const report = services.map((service) => {
    const filteredProposals = service.proposals.filter((ps) => {
      const p = ps.proposal
      const pDate = new Date(p.createdAt)
      const inDateRange = pDate >= startDate && pDate <= endDate
      const matchesClient = !clientId || p.clientId === clientId
      const matchesThematic = !thematicAreaId || p.thematicAreas.some((ta) => ta.thematicAreaId === thematicAreaId)
      return inDateRange && matchesClient && matchesThematic
    })

    const proposals = filteredProposals.map((ps) => ps.proposal)
    const wonProposals = proposals.filter((p) => p.status === 'Won')
    const winRate = proposals.length > 0 ? Math.round((wonProposals.length / proposals.length) * 100) : 0

    // Get target for this service (annual target - month is null)
    const serviceTarget = targets.find((t) => t.serviceId === service.id && t.month === null)
    const targetAmount = serviceTarget?.amount || 0
    const achievementPct = targetAmount > 0
      ? Math.round((wonProposals.reduce((sum, p) => sum + p.value, 0) / targetAmount) * 100)
      : 0

    return {
      id: service.id,
      name: service.name,
      color: service.color,
      proposalCount: proposals.length,
      totalValue: proposals.reduce((sum, p) => sum + p.value, 0),
      wonValue: wonProposals.reduce((sum, p) => sum + p.value, 0),
      winRate,
      targetAmount,
      achievementPct,
      proposals: proposals.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        value: p.value,
        client: p.client,
      })),
    }
  })

  // Overall service summary
  const totalServices = services.length
  const proposalWhere: Record<string, unknown> = {
    createdAt: { gte: startDate, lte: endDate },
    services: { some: {} },
  }
  if (clientId) {
    proposalWhere.clientId = clientId
  }
  if (thematicAreaId) {
    proposalWhere.thematicAreas = { some: { thematicAreaId } }
  }

  const proposalsWithServices = await db.proposal.findMany({
    where: proposalWhere,
    select: { id: true },
  })

  const totalWhere: Record<string, unknown> = {
    createdAt: { gte: startDate, lte: endDate },
  }
  if (clientId) {
    totalWhere.clientId = clientId
  }
  if (thematicAreaId) {
    totalWhere.thematicAreas = { some: { thematicAreaId } }
  }

  const totalProposalsInPeriod = await db.proposal.count({
    where: totalWhere,
  })
  const serviceCoverage = totalProposalsInPeriod > 0
    ? Math.round((proposalsWithServices.length / totalProposalsInPeriod) * 100)
    : 0

  return NextResponse.json({
    type: 'service',
    data: report,
    summary: {
      totalServices,
      proposalsWithServices: proposalsWithServices.length,
      serviceCoverage,
    },
    availableYears,
  })
}
