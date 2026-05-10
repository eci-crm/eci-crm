import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

interface ProposalCSVRow {
  name: string
  rfpNumber: string
  clientName: string
  assignedMemberName: string
  value: string
  status: string
  winningChances: string
  focalPerson: string
  followUpDate: string
  remarks: string
  deadline: string
  submissionDate: string
  thematicAreas: string
  services: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const result = Papa.parse<ProposalCSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing error',
        details: result.errors.map(e => `Row ${e.row}: ${e.message}`)
      }, { status: 400 })
    }

    if (result.data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // Pre-load lookup data
    const allClients = await db.client.findMany()
    const allMembers = await db.teamMember.findMany({ where: { isActive: true } })
    const allThematicAreas = await db.thematicArea.findMany()
    const allServices = await db.service.findMany()

    const validStatuses = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']
    const validChances = ['Low', 'Medium', 'High', '']

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i]

      if (!row.name || !row.name.trim()) {
        errors.push(`Row ${i + 2}: Proposal name is required`)
        skipped++
        continue
      }

      if (!row.clientName || !row.clientName.trim()) {
        errors.push(`Row ${i + 2}: Client name is required`)
        skipped++
        continue
      }

      // Find client by name
      const client = allClients.find(c => c.name.toLowerCase() === row.clientName.trim().toLowerCase())
      if (!client) {
        errors.push(`Row ${i + 2}: Client "${row.clientName}" not found. Create the client first.`)
        skipped++
        continue
      }

      // Validate status
      const status = row.status?.trim() || 'In Process'
      if (!validStatuses.includes(status)) {
        errors.push(`Row ${i + 2}: Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`)
        skipped++
        continue
      }

      // Validate winning chances
      const winningChances = row.winningChances?.trim() || ''
      if (winningChances && !validChances.includes(winningChances)) {
        errors.push(`Row ${i + 2}: Invalid winning chances "${winningChances}". Must be Low, Medium, or High`)
        skipped++
        continue
      }

      // Find assigned member by name
      let assignedMemberId: string | null = null
      if (row.assignedMemberName?.trim()) {
        const member = allMembers.find(m => m.name.toLowerCase() === row.assignedMemberName.trim().toLowerCase())
        if (member) {
          assignedMemberId = member.id
        } else {
          errors.push(`Row ${i + 2}: Member "${row.assignedMemberName}" not found. Proposal will be unassigned.`)
        }
      }

      // Parse value
      const value = parseFloat(row.value?.replace(/[^0-9.-]/g, '') || '0')
      if (isNaN(value)) {
        errors.push(`Row ${i + 2}: Invalid value "${row.value}"`)
        skipped++
        continue
      }

      // Parse dates
      const parseDate = (dateStr: string): Date | null => {
        if (!dateStr?.trim()) return null
        try {
          const d = new Date(dateStr.trim())
          return isNaN(d.getTime()) ? null : d
        } catch {
          return null
        }
      }

      const deadline = parseDate(row.deadline)
      const submissionDate = parseDate(row.submissionDate)
      const followUpDate = parseDate(row.followUpDate)

      // Parse thematic areas (comma-separated names)
      const thematicAreaIds: string[] = []
      if (row.thematicAreas?.trim()) {
        const areaNames = row.thematicAreas.split(',').map(a => a.trim().toLowerCase())
        for (const areaName of areaNames) {
          const area = allThematicAreas.find(a => a.name.toLowerCase() === areaName)
          if (area) {
            thematicAreaIds.push(area.id)
          }
        }
      }

      // Parse services (comma-separated names)
      const serviceIds: string[] = []
      if (row.services?.trim()) {
        const serviceNames = row.services.split(',').map(s => s.trim().toLowerCase())
        for (const serviceName of serviceNames) {
          const service = allServices.find(s => s.name.toLowerCase() === serviceName)
          if (service) {
            serviceIds.push(service.id)
          }
        }
      }

      const proposal = await db.proposal.create({
        data: {
          name: row.name.trim(),
          rfpNumber: row.rfpNumber?.trim() || '',
          clientId: client.id,
          assignedMemberId,
          value,
          status,
          winningChances,
          focalPerson: row.focalPerson?.trim() || '',
          followUpDate,
          remarks: row.remarks?.trim() || '',
          deadline,
          submissionDate,
          thematicAreas: {
            create: thematicAreaIds.map(thematicAreaId => ({ thematicAreaId })),
          },
          services: {
            create: serviceIds.map(serviceId => ({ serviceId })),
          },
        },
      })

      created++
    }

    return NextResponse.json({
      message: `Import complete: ${created} proposals created, ${skipped} skipped`,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error importing proposals:', error)
    return NextResponse.json({ error: 'Failed to import proposals' }, { status: 500 })
  }
}

// Return CSV template
export async function GET() {
  const csvContent = `name,rfpNumber,clientName,assignedMemberName,value,status,winningChances,focalPerson,followUpDate,remarks,deadline,submissionDate,thematicAreas,services
Proposal Name,RFP-2025-001,Client Name,Team Member Name,1000000,In Process,Medium,Contact Person,2025-06-15,Remarks here,2025-07-01,2025-06-28,Information Technology;Cybersecurity,IT Consulting;System Integration`

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=proposals_template.csv',
    },
  })
}
