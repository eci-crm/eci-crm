import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function ensureSetup() {
  const userCount = await db.user.count()
  if (userCount === 0) {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('password123', 10)

    await db.user.create({
      data: {
        email: 'admin@ecicrm.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Management',
        isActive: true
      }
    })

    // Create demo users
    const demoPassword = await bcrypt.hash('demo123', 10)

    await db.user.createMany({
      data: [
        {
          email: 'ahmed@ecicrm.com',
          name: 'Ahmed Khan',
          password: demoPassword,
          role: 'MANAGER',
          department: 'Sales',
          isActive: true
        },
        {
          email: 'sarah@ecicrm.com',
          name: 'Sarah Ali',
          password: demoPassword,
          role: 'STAFF',
          department: 'Technical',
          isActive: true
        },
        {
          email: 'hassan@ecicrm.com',
          name: 'Hassan Malik',
          password: demoPassword,
          role: 'STAFF',
          department: 'Finance',
          isActive: true
        }
      ]
    })

    // Create resource categories if they don't exist
    const categoryCount = await db.resourceCategory.count()
    if (categoryCount === 0) {
      await db.resourceCategory.createMany({
        data: [
          { name: 'Proposal Templates', slug: 'proposal-templates', description: 'Standard proposal templates and formats', order: 1 },
          { name: 'Company Profile', slug: 'company-profile', description: 'Company brochures, profiles, and presentations', order: 2 },
          { name: 'Technical Documents', slug: 'technical-documents', description: 'Technical specifications and documentation', order: 3 },
          { name: 'Financial Templates', slug: 'financial-templates', description: 'Budget templates and financial documents', order: 4 },
          { name: 'Legal Documents', slug: 'legal-documents', description: 'Contracts, NDAs, and legal templates', order: 5 },
          { name: 'Marketing Materials', slug: 'marketing-materials', description: 'Marketing collaterals and promotional content', order: 6 },
          { name: 'Case Studies', slug: 'case-studies', description: 'Success stories and case studies', order: 7 },
          { name: 'Certificates & Awards', slug: 'certificates-awards', description: 'Certifications, awards, and achievements', order: 8 }
        ]
      })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Ensure at least the admin user exists
    await ensureSetup()

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
