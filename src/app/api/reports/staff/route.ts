import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)
    
    // Get all active users
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      }
    })
    
    // Get all proposals for the year
    const proposals = await db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: startOfYear, lte: endOfYear } },
          { createdAt: { gte: startOfYear, lte: endOfYear } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true } },
        teamMembers: { include: { user: { select: { id: true, name: true } } } }
      }
    })
    
    // Get all tasks
    const tasks = await db.task.findMany({
      include: {
        assignee: { select: { id: true, name: true } },
        proposal: { select: { id: true, title: true } }
      }
    })
    
    // Calculate workload per team member
    const staffStats = users.map(user => {
      // Proposals owned
      const ownedProposals = proposals.filter(p => p.ownerId === user.id)
      
      // Proposals participated as team member
      const teamProposals = proposals.filter(p => 
        p.teamMembers.some(tm => tm.userId === user.id)
      )
      
      // All proposals involved in
      const allProposals = [...new Set([...ownedProposals, ...teamProposals])]
      
      // Task stats
      const userTasks = tasks.filter(t => t.assigneeId === user.id)
      const completedTasks = userTasks.filter(t => t.status === 'COMPLETED')
      const pendingTasks = userTasks.filter(t => t.status !== 'COMPLETED')
      const overdueTasks = userTasks.filter(t => 
        t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
      )
      
      // Won proposals
      const wonProposals = allProposals.filter(p => p.stage === 'ACCEPTED')
      const wonValuePKR = wonProposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0)
      const wonValueUSD = wonProposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        proposalsOwned: ownedProposals.length,
        proposalsAsTeam: teamProposals.length,
        totalProposals: allProposals.length,
        wonProposals: wonProposals.length,
        wonValuePKR,
        wonValueUSD,
        tasks: {
          total: userTasks.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          overdue: overdueTasks.length,
          completionRate: userTasks.length > 0 
            ? Math.round((completedTasks.length / userTasks.length) * 100) 
            : 0
        },
        workload: allProposals.length + pendingTasks.length
      }
    }).sort((a, b) => b.workload - a.workload)
    
    // Department summary
    const departmentStats = new Map<string, { 
      department: string
      members: number
      proposals: number
      wonValue: number
      tasksCompleted: number
    }>()
    
    staffStats.forEach(user => {
      const dept = user.department || 'Unassigned'
      const existing = departmentStats.get(dept)
      if (existing) {
        existing.members++
        existing.proposals += user.totalProposals
        existing.wonValue += user.wonValuePKR
        existing.tasksCompleted += user.tasks.completed
      } else {
        departmentStats.set(dept, {
          department: dept,
          members: 1,
          proposals: user.totalProposals,
          wonValue: user.wonValuePKR,
          tasksCompleted: user.tasks.completed
        })
      }
    })
    
    // Overall summary
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length
    
    return NextResponse.json({
      year,
      summary: {
        totalStaff: users.length,
        totalProposals: proposals.length,
        totalTasks,
        tasksCompleted: completedTasks,
        tasksPending: pendingTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      staffStats,
      departmentStats: Array.from(departmentStats.values())
    })
  } catch (error) {
    console.error('Error generating staff report:', error)
    return NextResponse.json({ error: 'Failed to generate staff report' }, { status: 500 })
  }
}
