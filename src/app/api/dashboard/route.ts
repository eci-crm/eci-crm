import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 1. CHANGED db.contact to db.client
    // 2. Renamed the variable from contacts to clients for clarity
    const [clients, proposals, tasks] = await Promise.all([
      db.client.findMany(), 
      db.proposal.findMany({ include: { budgets: true } }),
      db.task.findMany()
    ])

    const totalRevenue = proposals
      .filter(p => p.status === 'ACCEPTED')
      .reduce((sum, p) => sum + p.totalAmount, 0)

    const activeProposals = proposals.filter(p => 
      ['DRAFT', 'SENT'].includes(p.status)
    ).length

    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length

    const conversionRate = clients.length > 0 
      ? Math.round((clients.filter(c => c.status === 'CUSTOMER').length / clients.length) * 100)
      : 0

    return NextResponse.json({
      // CRITICAL: I kept the key name as 'totalContacts' so your frontend UI doesn't break!
      totalContacts: clients.length, 
      activeProposals,
      pendingTasks,
      totalRevenue,
      conversionRate,
      avgResponseTime: '2.5 hours'
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({
      totalContacts: 0, // Kept as totalContacts for the frontend
      activeProposals: 0,
      pendingTasks: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgResponseTime: 'N/A'
    })
  }
}
