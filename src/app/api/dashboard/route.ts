import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31)
    
    // Get all proposals for this year
    const proposals = await db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: startOfYear, lte: endOfYear } },
          { createdAt: { gte: startOfYear, lte: endOfYear } }
        ]
      },
      include: {
        contact: { select: { company: true, sector: true } },
        owner: { select: { id: true, name: true } }
      }
    })
    
    // Get all clients
    const clients = await db.contact.findMany()
    
    // Get all tasks
    const tasks = await db.task.findMany({
      include: { assignee: { select: { id: true, name: true } } }
    })
    
    // Get all users
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true }
    })
    
    // Calculate proposal stats
    const totalProposals = proposals.length
    const acceptedProposals = proposals.filter(p => p.stage === 'ACCEPTED')
    const rejectedProposals = proposals.filter(p => p.stage === 'REJECTED')
    const submittedProposals = proposals.filter(p => ['SUBMITTED', 'UNDER_EVALUATION', 'ACCEPTED', 'REJECTED'].includes(p.stage))
    const inEvaluationProposals = proposals.filter(p => p.stage === 'UNDER_EVALUATION')
    const draftProposals = proposals.filter(p => p.stage === 'NEW' || p.stage === 'DRAFT' || p.status === 'DRAFT')
    
    // Calculate values
    const totalValuePKR = proposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0)
    const totalValueUSD = proposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
    const wonValuePKR = acceptedProposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0)
    const wonValueUSD = acceptedProposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
    
    // Win rate
    const winRate = submittedProposals.length > 0 
      ? Math.round((acceptedProposals.length / submittedProposals.length) * 100) 
      : 0
    
    // Task stats
    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED')
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
    const overdueTasks = tasks.filter(t => 
      t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
    )
    
    // Proposals by month
    const proposalsByMonth = Array(12).fill(0).map((_, i) => {
      const monthProposals = proposals.filter(p => {
        const date = p.submissionDate || p.createdAt
        return date && new Date(date).getMonth() === i
      })
      return {
        month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
        count: monthProposals.length,
        valuePKR: monthProposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0),
        valueUSD: monthProposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
      }
    })
    
    // Proposals by stage
    const proposalsByStage = [
      { stage: 'New', count: proposals.filter(p => p.stage === 'NEW').length },
      { stage: 'In Progress', count: proposals.filter(p => p.stage === 'IN_PROGRESS').length },
      { stage: 'Submitted', count: proposals.filter(p => p.stage === 'SUBMITTED').length },
      { stage: 'Under Evaluation', count: inEvaluationProposals.length },
      { stage: 'Accepted', count: acceptedProposals.length },
      { stage: 'Rejected', count: rejectedProposals.length }
    ]
    
    // Top clients by proposal count
    const clientProposalCounts = new Map<string, { name: string; count: number; value: number }>()
    proposals.forEach(p => {
      if (p.contact) {
        const key = p.contact.company || p.contactId || 'Unknown'
        const existing = clientProposalCounts.get(key)
        if (existing) {
          existing.count++
          existing.value += p.valuePKR || 0
        } else {
          clientProposalCounts.set(key, {
            name: p.contact.company || 'Unknown',
            count: 1,
            value: p.valuePKR || 0
          })
        }
      }
    })
    const topClients = Array.from(clientProposalCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Proposals by sector
    const sectorCounts = new Map<string, { sector: string; count: number; accepted: number }>()
    proposals.forEach(p => {
      const sector = p.sector || p.contact?.sector || 'Unknown'
      const existing = sectorCounts.get(sector)
      if (existing) {
        existing.count++
        if (p.stage === 'ACCEPTED') existing.accepted++
      } else {
        sectorCounts.set(sector, {
          sector,
          count: 1,
          accepted: p.stage === 'ACCEPTED' ? 1 : 0
        })
      }
    })
    const proposalsBySector = Array.from(sectorCounts.values())
      .map(s => ({
        ...s,
        successRate: s.count > 0 ? Math.round((s.accepted / s.count) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
    
    return NextResponse.json({
      summary: {
        totalProposals,
        acceptedProposals: acceptedProposals.length,
        rejectedProposals: rejectedProposals.length,
        inEvaluationProposals: inEvaluationProposals.length,
        draftProposals: draftProposals.length,
        totalValuePKR,
        totalValueUSD,
        wonValuePKR,
        wonValueUSD,
        winRate,
        totalClients: clients.length,
        pendingTasks: pendingTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        totalUsers: users.length
      },
      proposalsByMonth,
      proposalsByStage,
      topClients,
      proposalsBySector,
      recentProposals: proposals.slice(0, 5),
      upcomingDeadlines: proposals
        .filter(p => p.deadline && new Date(p.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5),
      pendingTasksList: pendingTasks.slice(0, 5)
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
