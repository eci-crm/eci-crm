import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const assignedMemberId = searchParams.get('assignedMemberId')
    const serviceId = searchParams.get('serviceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (assignedMemberId) where.assignedMemberId = assignedMemberId

    if (serviceId) {
      where.services = {
        some: { serviceId },
      }
    }

    if (startDate || endDate) {
      const createdAt: Record<string, unknown> = {}
      if (startDate) createdAt.gte = new Date(startDate)
      if (endDate) createdAt.lte = new Date(endDate)
      where.createdAt = createdAt
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { rfpNumber: { contains: search } },
        { client: { name: { contains: search } } },
      ]
    }

    const proposals = await db.proposal.findMany({
      where,
      include: {
        client: true,
        assignedMember: true,
        thematicAreas: {
          include: {
            thematicArea: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      rfpNumber,
      clientId,
      assignedMemberId,
      value,
      status,
      winningChances,
      focalPerson,
      followUpDate,
      remarks,
      deadline,
      submissionDate,
      thematicAreaIds = [],
      serviceIds = [],
    } = body

    if (!name || !clientId) {
      return NextResponse.json({ error: 'Name and clientId are required' }, { status: 400 })
    }

    const proposal = await db.proposal.create({
      data: {
        name,
        rfpNumber: rfpNumber || '',
        clientId,
        assignedMemberId: assignedMemberId || null,
        value: value ?? 0,
        status: status || 'In Process',
        winningChances: winningChances || '',
        focalPerson: focalPerson || '',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        remarks: remarks || '',
        deadline: deadline ? new Date(deadline) : null,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        thematicAreas: {
          create: thematicAreaIds.map((thematicAreaId: string) => ({
            thematicAreaId,
          })),
        },
        services: {
          create: serviceIds.map((serviceId: string) => ({
            serviceId,
          })),
        },
      },
      include: {
        client: true,
        assignedMember: true,
        thematicAreas: {
          include: {
            thematicArea: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      rfpNumber,
      clientId,
      assignedMemberId,
      value,
      status,
      winningChances,
      focalPerson,
      followUpDate,
      remarks,
      deadline,
      submissionDate,
      thematicAreaIds,
      serviceIds,
    } = body

    // Build update data only from explicitly provided fields to prevent data loss
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (rfpNumber !== undefined) data.rfpNumber = rfpNumber
    if (clientId !== undefined) data.clientId = clientId
    if (assignedMemberId !== undefined) data.assignedMemberId = assignedMemberId || null
    if (value !== undefined) data.value = value
    if (status !== undefined) data.status = status
    if (winningChances !== undefined) data.winningChances = winningChances
    if (focalPerson !== undefined) data.focalPerson = focalPerson
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (remarks !== undefined) data.remarks = remarks
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null
    if (submissionDate !== undefined) data.submissionDate = submissionDate ? new Date(submissionDate) : null

    // Only delete/recreate relations if explicitly provided in the request
    if (thematicAreaIds !== undefined) {
      await db.proposalThematicArea.deleteMany({ where: { proposalId: id } })
      data.thematicAreas = {
        create: thematicAreaIds.map((thematicAreaId: string) => ({ thematicAreaId })),
      }
    }
    if (serviceIds !== undefined) {
      await db.proposalService.deleteMany({ where: { proposalId: id } })
      data.services = {
        create: serviceIds.map((serviceId: string) => ({ serviceId })),
      }
    }

    const proposal = await db.proposal.update({
      where: { id },
      data,
      include: {
        client: true,
        assignedMember: true,
        thematicAreas: {
          include: {
            thematicArea: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Cascade deletes will handle thematicAreas and services
    await db.proposal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
