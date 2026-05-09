import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      clients,
      teamMembers,
      thematicAreas,
      services,
      proposals,
      proposalThematicAreas,
      proposalServices,
      businessTargets,
      resourceFolders,
      resources,
      settings,
      notifications,
      activityLogs,
      chatMessages,
    ] = await Promise.all([
      db.client.findMany(),
      db.teamMember.findMany(),
      db.thematicArea.findMany(),
      db.service.findMany(),
      db.proposal.findMany(),
      db.proposalThematicArea.findMany(),
      db.proposalService.findMany(),
      db.businessTarget.findMany(),
      db.resourceFolder.findMany(),
      db.resource.findMany(),
      db.setting.findMany(),
      db.notification.findMany(),
      db.activityLog.findMany(),
      db.chatMessage.findMany(),
    ])

    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        clients,
        teamMembers,
        thematicAreas,
        services,
        proposals,
        proposalThematicAreas,
        proposalServices,
        businessTargets,
        resourceFolders,
        resources,
        settings,
        notifications,
        activityLogs,
        chatMessages,
      },
    }

    return NextResponse.json(backup)
  } catch (error) {
    console.error('Error exporting backup:', error)
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: 'Backup data is required' }, { status: 400 })
    }

    // Restore in order respecting foreign key constraints
    // First, clear existing data in reverse dependency order
    await db.chatMessage.deleteMany()
    await db.activityLog.deleteMany()
    await db.notification.deleteMany()
    await db.setting.deleteMany()
    await db.resource.deleteMany()
    await db.resourceFolder.deleteMany()
    await db.proposalThematicArea.deleteMany()
    await db.proposalService.deleteMany()
    await db.proposal.deleteMany()
    await db.businessTarget.deleteMany()
    await db.service.deleteMany()
    await db.thematicArea.deleteMany()
    await db.teamMember.deleteMany()
    await db.client.deleteMany()

    // Then restore data in dependency order
    if (data.clients?.length) {
      await db.client.createMany({ data: data.clients })
    }
    if (data.teamMembers?.length) {
      await db.teamMember.createMany({ data: data.teamMembers })
    }
    if (data.thematicAreas?.length) {
      await db.thematicArea.createMany({ data: data.thematicAreas })
    }
    if (data.services?.length) {
      await db.service.createMany({ data: data.services })
    }
    if (data.proposals?.length) {
      await db.proposal.createMany({ data: data.proposals })
    }
    if (data.proposalThematicAreas?.length) {
      await db.proposalThematicArea.createMany({ data: data.proposalThematicAreas })
    }
    if (data.proposalServices?.length) {
      await db.proposalService.createMany({ data: data.proposalServices })
    }
    if (data.businessTargets?.length) {
      await db.businessTarget.createMany({ data: data.businessTargets })
    }
    if (data.resourceFolders?.length) {
      await db.resourceFolder.createMany({ data: data.resourceFolders })
    }
    if (data.resources?.length) {
      await db.resource.createMany({ data: data.resources })
    }
    if (data.settings?.length) {
      await db.setting.createMany({ data: data.settings })
    }
    if (data.notifications?.length) {
      await db.notification.createMany({ data: data.notifications })
    }
    if (data.activityLogs?.length) {
      await db.activityLog.createMany({ data: data.activityLogs })
    }
    if (data.chatMessages?.length) {
      await db.chatMessage.createMany({ data: data.chatMessages })
    }

    return NextResponse.json({ success: true, message: 'Backup restored successfully' })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
