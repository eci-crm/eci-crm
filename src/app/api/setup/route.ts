import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const demoUsers = [
  { email: 'admin@crm.com', name: 'Admin User', role: 'ADMIN', department: 'Management' },
  { email: 'manager@crm.com', name: 'Sarah Manager', role: 'MANAGER', department: 'Sales' },
  { email: 'sales@crm.com', name: 'John Sales', role: 'SALES_REP', department: 'Sales' },
  { email: 'viewer@crm.com', name: 'Jane Viewer', role: 'VIEWER', department: 'Marketing' }
]

const demoContacts = [
  { name: 'Acme Corporation', email: 'contact@acme.com', company: 'Acme Corp', status: 'CUSTOMER', source: 'Website' },
  { name: 'Tech Solutions Inc', email: 'info@techsolutions.com', company: 'Tech Solutions', status: 'PROSPECT', source: 'Referral' },
  { name: 'Global Industries', email: 'sales@globalind.com', company: 'Global Industries', status: 'LEAD', source: 'Trade Show' },
  { name: 'StartUp Ventures', email: 'hello@startupv.com', company: 'StartUp Ventures', status: 'PROSPECT', source: 'LinkedIn' },
  { name: 'Enterprise Plus', email: 'contact@enterpriseplus.com', company: 'Enterprise Plus', status: 'CUSTOMER', source: 'Cold Call' }
]

const demoTasks = [
  { title: 'Follow up with Acme Corp', description: 'Discuss Q2 contract renewal', priority: 'HIGH', status: 'IN_PROGRESS' },
  { title: 'Prepare proposal for Tech Solutions', description: 'Create detailed pricing proposal', priority: 'HIGH', status: 'TODO' },
  { title: 'Schedule demo with Global Industries', description: 'Product demo scheduled for next week', priority: 'MEDIUM', status: 'TODO' },
  { title: 'Update CRM records', description: 'Add new leads from trade show', priority: 'LOW', status: 'COMPLETED' }
]

export async function GET() {
  try {
    const existingUsers = await db.user.findMany()
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'Database already seeded', users: existingUsers.length })
    }

    const users = []
    for (const userData of demoUsers) {
      const user = await db.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: 'password123',
          role: userData.role,
          department: userData.department,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
        }
      })
      users.push(user)
    }

    const adminUser = users[0]
    const salesUser = users[2]

    for (const contactData of demoContacts) {
      await db.contact.create({
        data: {
          name: contactData.name,
          email: contactData.email,
          company: contactData.company,
          status: contactData.status,
          source: contactData.source,
          ownerId: adminUser.id
        }
      })
    }

    const contacts = await db.contact.findMany()
    for (let i = 0; i < Math.min(3, contacts.length); i++) {
      const contact = contacts[i]
      await db.proposal.create({
        data: {
          title: `Proposal for ${contact.company}`,
          description: `Enterprise solution package for ${contact.name}`,
          status: i === 0 ? 'ACCEPTED' : i === 1 ? 'SENT' : 'DRAFT',
          totalAmount: Math.floor(Math.random() * 50000) + 10000,
          contactId: contact.id,
          ownerId: adminUser.id,
          budgets: {
            create: [
              { name: 'Software License', amount: Math.floor(Math.random() * 20000) + 5000, category: 'License' },
              { name: 'Implementation', amount: Math.floor(Math.random() * 15000) + 3000, category: 'Services' },
              { name: 'Training', amount: Math.floor(Math.random() * 5000) + 1000, category: 'Services' }
            ]
          }
        }
      })
    }

    for (const taskData of demoTasks) {
      await db.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          assigneeId: salesUser.id
        }
      })
    }

    const activityTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE']
    for (let i = 0; i < 10; i++) {
      await db.activity.create({
        data: {
          type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
          title: `Activity ${i + 1}`,
          description: `Demo activity for testing purposes`,
          userId: users[Math.floor(Math.random() * users.length)].id
        }
      })
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      users: users.length,
      contacts: demoContacts.length,
      proposals: 3,
      tasks: demoTasks.length
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Setup failed', details: String(error) }, { status: 500 })
  }
}
