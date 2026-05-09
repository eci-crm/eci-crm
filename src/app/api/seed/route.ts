import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Check if notifications already exist
    const existing = await db.notification.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Notifications already seeded', count: existing })
    }

    const now = new Date()

    const notifications = await Promise.all([
      db.notification.create({
        data: {
          type: 'deadline',
          title: 'Proposal Deadline Approaching',
          message: 'UNDP Health Sector proposal is due in 2 days. Make sure all documents are finalized.',
          isRead: false,
          createdAt: new Date(now.getTime() - 30 * 60000), // 30 min ago
        },
      }),
      db.notification.create({
        data: {
          type: 'follow_up',
          title: 'Follow-up Required',
          message: 'World Bank Education project needs a follow-up call. Last contact was 5 days ago.',
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 3600000), // 2 hours ago
        },
      }),
      db.notification.create({
        data: {
          type: 'status_change',
          title: 'Proposal Status Updated',
          message: 'USAID Climate Resilience proposal moved to "In Evaluation" stage.',
          isRead: false,
          createdAt: new Date(now.getTime() - 5 * 3600000), // 5 hours ago
        },
      }),
      db.notification.create({
        data: {
          type: 'target',
          title: 'Monthly Target Achieved!',
          message: 'Congratulations! Your team has reached 102% of the March business target. Outstanding performance!',
          isRead: true,
          createdAt: new Date(now.getTime() - 24 * 3600000), // Yesterday
        },
      }),
      db.notification.create({
        data: {
          type: 'info',
          title: 'New Client Added',
          message: 'Asian Development Bank has been added to the client database. Consider scheduling an introductory meeting.',
          isRead: true,
          createdAt: new Date(now.getTime() - 2 * 24 * 3600000), // 2 days ago
        },
      }),
      db.notification.create({
        data: {
          type: 'deadline',
          title: 'RFP Submission Deadline',
          message: 'EU Governance Reform RFP submission deadline is next Monday at 3:00 PM.',
          isRead: false,
          createdAt: new Date(now.getTime() - 3 * 3600000), // 3 hours ago
        },
      }),
      db.notification.create({
        data: {
          type: 'target',
          title: 'Quarterly Target Update',
          message: 'Q1 target progress is at 78%. You need ₨ 4.5M more to hit the quarterly goal.',
          isRead: true,
          createdAt: new Date(now.getTime() - 3 * 24 * 3600000), // 3 days ago
        },
      }),
    ])

    return NextResponse.json({ message: 'Demo notifications seeded successfully', count: notifications.length })
  } catch (error) {
    console.error('Error seeding notifications:', error)
    return NextResponse.json({ error: 'Failed to seed notifications' }, { status: 500 })
  }
}
