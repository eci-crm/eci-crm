import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Check if users already exist
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ message: 'Database already seeded', usersCount: existingUsers })
    }

    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create demo users
    const users = await Promise.all([
      db.user.create({
        data: {
          email: 'admin@crm.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'ADMIN',
          department: 'Management'
        }
      }),
      db.user.create({
        data: {
          email: 'manager@crm.com',
          name: 'Manager User',
          password: hashedPassword,
          role: 'MANAGER',
          department: 'Sales'
        }
      }),
      db.user.create({
        data: {
          email: 'sales@crm.com',
          name: 'Sales Rep',
          password: hashedPassword,
          role: 'SALES_REP',
          department: 'Sales'
        }
      }),
      db.user.create({
        data: {
          email: 'viewer@crm.com',
          name: 'Viewer User',
          password: hashedPassword,
          role: 'VIEWER',
          department: 'Operations'
        }
      })
    ])

    return NextResponse.json({ 
      message: 'Database seeded successfully', 
      users: users.map(u => ({ email: u.email, role: u.role }))
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 })
  }
}
