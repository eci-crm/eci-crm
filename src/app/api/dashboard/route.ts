import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [contacts, proposals, tasks] = await Promise.all([
      db.contact.findMany(),
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

    const conversionRate = contacts.length > 0 
      ? Math.round((contacts.filter(c => c.status === 'CUSTOMER').length / contacts.length) * 100)
      : 0

    return NextResponse.json({
      totalContacts: contacts.length,
      activeProposals,
      pendingTasks,
      totalRevenue,
      conversionRate,
      avgResponseTime: '2.5 hours'
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({
      totalContacts: 0,
      activeProposals: 0,
      pendingTasks: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgResponseTime: 'N/A'
    })
  }
}
