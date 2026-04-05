import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true,
        createdAt: true
      }
    })
    
    // Test password comparison
    const testResults = []
    for (const user of users) {
      const testPassword = user.email === 'admin@ecicrm.com' ? 'password123' : 'demo123'
      const isValid = await bcrypt.compare(testPassword, user.password)
      testResults.push({
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        passwordHash: user.password.substring(0, 20) + '...',
        testPassword,
        passwordValid: isValid
      })
    }
    
    return NextResponse.json({
      userCount: users.length,
      users: testResults
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
