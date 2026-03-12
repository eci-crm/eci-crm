import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Delete existing users first
    await db.user.deleteMany({})
    
    // Create fresh users with properly hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 12)

    const users = await Promise.all([
      db.user.create({
        data: { 
          id: 'user-admin',
          email: 'admin@crm.com', 
          name: 'Admin User', 
          password: hashedPassword, 
          role: 'ADMIN', 
          department: 'Management',
          isActive: true 
        }
      }),
      db.user.create({
        data: { 
          id: 'user-manager',
          email: 'manager@crm.com', 
          name: 'Manager User', 
          password: hashedPassword, 
          role: 'MANAGER', 
          department: 'Sales',
          isActive: true 
        }
      }),
      db.user.create({
        data: { 
          id: 'user-sales',
          email: 'sales@crm.com', 
          name: 'Sales Rep', 
          password: hashedPassword, 
          role: 'SALES_REP', 
          department: 'Sales',
          isActive: true 
        }
      }),
      db.user.create({
        data: { 
          id: 'user-viewer',
          email: 'viewer@crm.com', 
          name: 'Viewer User', 
          password: hashedPassword, 
          role: 'VIEWER', 
          department: 'Operations',
          isActive: true 
        }
      })
    ])

    // Verify password works
    const testUser = await db.user.findUnique({ where: { email: 'admin@crm.com' } })
    const passwordTest = testUser ? await bcrypt.compare('password123', testUser.password) : false

    return NextResponse.json({ 
      message: 'Database reset and seeded successfully', 
      users: users.map(u => ({ email: u.email, role: u.role })),
      passwordTest: passwordTest ? 'OK' : 'FAILED'
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 })
  }
}
