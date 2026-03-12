import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12)

    // Update existing users with fresh passwords
    await db.user.update({
      where: { email: 'admin@crm.com' },
      data: { password: hashedPassword, isActive: true }
    })

    await db.user.update({
      where: { email: 'manager@crm.com' },
      data: { password: hashedPassword, isActive: true }
    })

    await db.user.update({
      where: { email: 'sales@crm.com' },
      data: { password: hashedPassword, isActive: true }
    })

    await db.user.update({
      where: { email: 'viewer@crm.com' },
      data: { password: hashedPassword, isActive: true }
    })

    return NextResponse.json({ 
      message: 'Passwords reset successfully! You can now login with password123',
      users: [
        { email: 'admin@crm.com', role: 'ADMIN' },
        { email: 'manager@crm.com', role: 'MANAGER' },
        { email: 'sales@crm.com', role: 'SALES_REP' },
        { email: 'viewer@crm.com', role: 'VIEWER' }
      ]
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Failed to reset passwords', details: String(error) }, { status: 500 })
  }
}
