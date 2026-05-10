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

    // Wrap restore in a transaction so if any createMany fails, original data isn't lost
    await db.$transaction(async (tx) => {
      // First, clear existing data in reverse dependency order
      await tx.chatMessage.deleteMany()
      await tx.activityLog.deleteMany()
      await tx.notification.deleteMany()
      await tx.setting.deleteMany()
      await tx.resource.deleteMany()
      await tx.resourceFolder.deleteMany()
      await tx.proposalThematicArea.deleteMany()
      await tx.proposalService.deleteMany()
      await tx.proposal.deleteMany()
      await tx.businessTarget.deleteMany()
      await tx.service.deleteMany()
      await tx.thematicArea.deleteMany()
      await tx.teamMember.deleteMany()
      await tx.client.deleteMany()

      // Then restore data in dependency order
      if (data.clients?.length) {
        await tx.client.createMany({ data: data.clients })
      }
      if (data.teamMembers?.length) {
        await tx.teamMember.createMany({ data: data.teamMembers })
      }
      if (data.thematicAreas?.length) {
        await tx.thematicArea.createMany({ data: data.thematicAreas })
      }
      if (data.services?.length) {
        await tx.service.createMany({ data: data.services })
      }
      if (data.proposals?.length) {
        await tx.proposal.createMany({ data: data.proposals })
      }
      if (data.proposalThematicAreas?.length) {
        await tx.proposalThematicArea.createMany({ data: data.proposalThematicAreas })
      }
      if (data.proposalServices?.length) {
        await tx.proposalService.createMany({ data: data.proposalServices })
      }
      if (data.businessTargets?.length) {
        await tx.businessTarget.createMany({ data: data.businessTargets })
      }
      if (data.resourceFolders?.length) {
        await tx.resourceFolder.createMany({ data: data.resourceFolders })
      }
      if (data.resources?.length) {
        await tx.resource.createMany({ data: data.resources })
      }
      if (data.settings?.length) {
        await tx.setting.createMany({ data: data.settings })
      }
      if (data.notifications?.length) {
        await tx.notification.createMany({ data: data.notifications })
      }
      if (data.activityLogs?.length) {
        await tx.activityLog.createMany({ data: data.activityLogs })
      }
      if (data.chatMessages?.length) {
        await tx.chatMessage.createMany({ data: data.chatMessages })
      }
    })

    return NextResponse.json({ success: true, message: 'Backup restored successfully' })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
