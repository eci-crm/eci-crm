import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection by counting records
    const usersCount = await db.user.count()
    const contactsCount = await db.contact.count()
    const proposalsCount = await db.proposal.count()
    const tasksCount = await db.task.count()
    
    return NextResponse.json({
      success: true,
      connected: true,
      counts: {
        users: usersCount,
        contacts: contactsCount,
        proposals: proposalsCount,
        tasks: tasksCount
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
