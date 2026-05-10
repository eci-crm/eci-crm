import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Smart seed endpoint: Only seeds if the database is empty.
// This ensures the app works on Vercel where the database is ephemeral.
// POST /api/seed - Seeds if empty, returns status either way.

export async function POST() {
  try {
    // Check if database already has data
    const clientCount = await db.client.count()

    if (clientCount > 0) {
      return NextResponse.json({
        message: 'Database already has data. Seed skipped.',
        clients: clientCount,
        seeded: false,
      })
    }

    // Database is empty — seed it with initial data
    await seedDatabase()

    return NextResponse.json({
      message: 'Database seeded successfully with initial data.',
      seeded: true,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const clientCount = await db.client.count()
    const proposalCount = await db.proposal.count()
    const serviceCount = await db.service.count()
    const teamCount = await db.teamMember.count()

    return NextResponse.json({
      initialized: clientCount > 0,
      counts: { clients: clientCount, proposals: proposalCount, services: serviceCount, teamMembers: teamCount },
    })
  } catch (error) {
    console.error('Seed check error:', error)
    return NextResponse.json({ initialized: false, error: String(error) }, { status: 500 })
  }
}

async function seedDatabase() {
  // ── Services ──────────────────────────────────────────────
  const managedServices = await db.service.create({ data: { name: 'Managed Services', color: '#8b5cf6', sortOrder: 0 } })
  const dataMigration = await db.service.create({ data: { name: 'Data Migration', color: '#f59e0b', sortOrder: 1 } })
  const systemIntegration = await db.service.create({ data: { name: 'System Integration', color: '#3b82f6', sortOrder: 2 } })
  const itConsulting = await db.service.create({ data: { name: 'IT Consulting', color: '#10b981', sortOrder: 3 } })
  const securityAuditing = await db.service.create({ data: { name: 'Security Auditing', color: '#ef4444', sortOrder: 4 } })
  const cloudSolutions = await db.service.create({ data: { name: 'Cloud Solutions', color: '#06b6d4', sortOrder: 5 } })

  // ── Thematic Areas ────────────────────────────────────────
  const digitalTransformation = await db.thematicArea.create({ data: { name: 'Digital Transformation', color: '#3b82f6', sortOrder: 0 } })
  const cybersecurity = await db.thematicArea.create({ data: { name: 'Cybersecurity', color: '#ef4444', sortOrder: 1 } })
  const cloudComputing = await db.thematicArea.create({ data: { name: 'Cloud Computing', color: '#06b6d4', sortOrder: 2 } })
  const dataAnalytics = await db.thematicArea.create({ data: { name: 'Data Analytics', color: '#8b5cf6', sortOrder: 3 } })
  const erpSystems = await db.thematicArea.create({ data: { name: 'ERP Systems', color: '#10b981', sortOrder: 4 } })
  const networkInfrastructure = await db.thematicArea.create({ data: { name: 'Network Infrastructure', color: '#f59e0b', sortOrder: 5 } })
  const itGovernance = await db.thematicArea.create({ data: { name: 'IT Governance', color: '#ec4899', sortOrder: 6 } })
  const softwareDevelopment = await db.thematicArea.create({ data: { name: 'Software Development', color: '#14b8a6', sortOrder: 7 } })

  // ── Team Members ──────────────────────────────────────────
  const ahmed = await db.teamMember.create({ data: { name: 'Ahmed Khan', email: 'ahmed@ecicrm.pk', role: 'Admin', password: 'admin123', isActive: true } })
  const fatima = await db.teamMember.create({ data: { name: 'Fatima Rizvi', email: 'fatima@ecicrm.pk', role: 'Manager', isActive: true } })
  const ali = await db.teamMember.create({ data: { name: 'Ali Hasan', email: 'ali@ecicrm.pk', role: 'Member', isActive: true } })
  const sana = await db.teamMember.create({ data: { name: 'Sana Mir', email: 'sana@ecicrm.pk', role: 'Member', isActive: true } })
  const usman = await db.teamMember.create({ data: { name: 'Usman Sheikh', email: 'usman@ecicrm.pk', role: 'Viewer', isActive: true } })
  const ayesha = await db.teamMember.create({ data: { name: 'Ayesha Malik', email: 'ayesha@ecicrm.pk', role: 'Member', isActive: false } })

  // ── Clients ───────────────────────────────────────────────
  const ptcl = await db.client.create({ data: { name: 'PTCL', address: 'G-8/2, Islamabad', status: 'Active' } })
  const pia = await db.client.create({ data: { name: 'PIA', address: 'PIA Building, Karachi', status: 'Active' } })
  const pakistanRailways = await db.client.create({ data: { name: 'Pakistan Railways', address: 'Railway Headquarters, Lahore', status: 'Inactive' } })
  const hbl = await db.client.create({ data: { name: 'HBL', address: 'HBL Plaza, Karachi', status: 'Active' } })
  const engro = await db.client.create({ data: { name: 'Engro Corporation', address: '24th Floor, The Harbour Front, Karachi', status: 'Active' } })
  const ssgc = await db.client.create({ data: { name: 'Sui Southern Gas', address: 'Sir Shah Suleman Road, Karachi', status: 'Active' } })
  const luckyCement = await db.client.create({ data: { name: 'Lucky Cement', address: 'Clifton, Karachi', status: 'Active' } })
  const nbp = await db.client.create({ data: { name: 'National Bank of Pakistan', address: 'I.I. Chundrigar Road, Karachi', status: 'Active' } })
  const wapda = await db.client.create({ data: { name: 'WAPDA', address: 'WAPDA House, Lahore', status: 'Active' } })
  const ogdcl = await db.client.create({ data: { name: 'OGDCL', address: 'Jinnah Avenue, Islamabad', status: 'Active' } })

  // ── Proposals ─────────────────────────────────────────────
  const proposalData = [
    { name: 'PTCL Network Modernization', rfpNumber: 'RFP-PTCL-2024-001', clientId: ptcl.id, assignedMemberId: ahmed.id, value: 12500000, status: 'Won', winningChances: 'High', focalPerson: 'Asif Mehmood', deadline: new Date('2024-03-15'), submissionDate: new Date('2024-03-10'), serviceIds: [managedServices.id, networkInfrastructure.id], thematicIds: [networkInfrastructure.id, digitalTransformation.id] },
    { name: 'NBP Cybersecurity Framework', rfpNumber: 'RFP-NBP-2024-001', clientId: nbp.id, assignedMemberId: fatima.id, value: 18000000, status: 'Won', winningChances: 'High', focalPerson: 'Tariq Javed', deadline: new Date('2024-04-20'), submissionDate: new Date('2024-04-15'), serviceIds: [securityAuditing.id, itConsulting.id], thematicIds: [cybersecurity.id, itGovernance.id] },
    { name: 'WAPDA ERP Implementation', rfpNumber: 'RFP-WAPDA-2024-001', clientId: wapda.id, assignedMemberId: ali.id, value: 25000000, status: 'Won', winningChances: 'High', focalPerson: 'Kamran Yousuf', deadline: new Date('2024-05-30'), submissionDate: new Date('2024-05-25'), serviceIds: [systemIntegration.id, itConsulting.id], thematicIds: [erpSystems.id, digitalTransformation.id] },
    { name: 'OGDCL Data Analytics Platform', rfpNumber: 'RFP-OGDCL-2024-001', clientId: ogdcl.id, assignedMemberId: sana.id, value: 8500000, status: 'Won', winningChances: 'Medium', focalPerson: 'Naveed Anwar', deadline: new Date('2024-06-10'), submissionDate: new Date('2024-06-05'), serviceIds: [dataMigration.id, itConsulting.id], thematicIds: [dataAnalytics.id, digitalTransformation.id] },
    { name: 'HBL Cloud Migration', rfpNumber: 'RFP-HBL-2024-001', clientId: hbl.id, assignedMemberId: ahmed.id, value: 15000000, status: 'Won', winningChances: 'High', focalPerson: 'Shahid Iqbal', deadline: new Date('2024-07-15'), submissionDate: new Date('2024-07-10'), serviceIds: [cloudSolutions.id, dataMigration.id], thematicIds: [cloudComputing.id, digitalTransformation.id] },
    { name: 'Engro Digital Transformation', rfpNumber: 'RFP-ENGRO-2024-001', clientId: engro.id, assignedMemberId: fatima.id, value: 20000000, status: 'Won', winningChances: 'High', focalPerson: 'Bilal Ahmed', deadline: new Date('2024-08-20'), submissionDate: new Date('2024-08-15'), serviceIds: [itConsulting.id, systemIntegration.id], thematicIds: [digitalTransformation.id, itGovernance.id] },
    { name: 'PIA IT Infrastructure Upgrade', rfpNumber: 'RFP-PIA-2024-001', clientId: pia.id, assignedMemberId: ali.id, value: 9800000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Rashid Khan', deadline: new Date('2024-09-15'), serviceIds: [managedServices.id, systemIntegration.id], thematicIds: [networkInfrastructure.id, digitalTransformation.id] },
    { name: 'SSGC Managed IT Services', rfpNumber: 'RFP-SSGC-2024-001', clientId: ssgc.id, assignedMemberId: sana.id, value: 6200000, status: 'Submitted', winningChances: 'Low', focalPerson: 'Faisal Nawaz', deadline: new Date('2024-09-30'), serviceIds: [managedServices.id, itConsulting.id], thematicIds: [itGovernance.id, digitalTransformation.id] },
    { name: 'Lucky Cement Security Audit', rfpNumber: 'RFP-LC-2024-001', clientId: luckyCement.id, assignedMemberId: ahmed.id, value: 3500000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Zubair Rana', deadline: new Date('2024-10-15'), serviceIds: [securityAuditing.id], thematicIds: [cybersecurity.id] },
    { name: 'PTCL Cloud Solutions Design', rfpNumber: 'RFP-PTCL-2024-002', clientId: ptcl.id, assignedMemberId: fatima.id, value: 7200000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Waqar Hassan', deadline: new Date('2024-11-01'), serviceIds: [cloudSolutions.id, itConsulting.id], thematicIds: [cloudComputing.id] },
    { name: 'NBP ERP Module Extension', rfpNumber: 'RFP-NBP-2024-002', clientId: nbp.id, assignedMemberId: ali.id, value: 5500000, status: 'In Process', winningChances: 'Low', focalPerson: 'Imran Siddiqui', deadline: new Date('2024-11-15'), serviceIds: [systemIntegration.id], thematicIds: [erpSystems.id] },
    { name: 'WAPDA Network Monitoring System', rfpNumber: 'RFP-WAPDA-2024-002', clientId: wapda.id, assignedMemberId: sana.id, value: 4800000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Ahmed Raza', deadline: new Date('2024-11-30'), serviceIds: [managedServices.id, systemIntegration.id], thematicIds: [networkInfrastructure.id] },
    { name: 'OGDCL Software Development Platform', rfpNumber: 'RFP-OGDCL-2024-002', clientId: ogdcl.id, assignedMemberId: ahmed.id, value: 11000000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Salman Farooq', deadline: new Date('2024-12-01'), serviceIds: [itConsulting.id, systemIntegration.id], thematicIds: [softwareDevelopment.id, digitalTransformation.id] },
    { name: 'HBL Data Migration Project', rfpNumber: 'RFP-HBL-2024-002', clientId: hbl.id, assignedMemberId: fatima.id, value: 9000000, status: 'In Process', winningChances: 'High', focalPerson: 'Adeel Hashmi', deadline: new Date('2024-12-10'), serviceIds: [dataMigration.id, cloudSolutions.id], thematicIds: [dataAnalytics.id, cloudComputing.id] },
    { name: 'PIA Cybersecurity Assessment', rfpNumber: 'RFP-PIA-2024-002', clientId: pia.id, assignedMemberId: ali.id, value: 4200000, status: 'In Evaluation', winningChances: 'Low', focalPerson: 'Nasir Mahmood', deadline: new Date('2024-12-20'), serviceIds: [securityAuditing.id, itConsulting.id], thematicIds: [cybersecurity.id, itGovernance.id] },
    { name: 'Engro Cloud Infrastructure Setup', rfpNumber: 'RFP-ENGRO-2024-002', clientId: engro.id, assignedMemberId: sana.id, value: 14000000, status: 'In Evaluation', winningChances: 'Medium', focalPerson: 'Hassan Zaidi', deadline: new Date('2025-01-10'), serviceIds: [cloudSolutions.id, systemIntegration.id], thematicIds: [cloudComputing.id, digitalTransformation.id] },
    { name: 'Lucky Cement IT Consulting', rfpNumber: 'RFP-LC-2024-002', clientId: luckyCement.id, assignedMemberId: ahmed.id, value: 2500000, status: 'In Evaluation', winningChances: 'Low', focalPerson: 'Khalid Pervez', deadline: new Date('2025-01-15'), serviceIds: [itConsulting.id], thematicIds: [itGovernance.id] },
    { name: 'Pakistan Railways Signal System IT', rfpNumber: 'RFP-PR-2024-001', clientId: pakistanRailways.id, assignedMemberId: null, value: 22000000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-02-01'), serviceIds: [systemIntegration.id, managedServices.id], thematicIds: [networkInfrastructure.id, digitalTransformation.id] },
    { name: 'SSGC Data Analytics Dashboard', rfpNumber: 'RFP-SSGC-2024-002', clientId: ssgc.id, assignedMemberId: null, value: 3800000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-02-15'), serviceIds: [dataMigration.id, itConsulting.id], thematicIds: [dataAnalytics.id] },
    { name: 'PTCL Digital Transformation Phase 2', rfpNumber: 'RFP-PTCL-2024-003', clientId: ptcl.id, assignedMemberId: null, value: 16000000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-03-01'), serviceIds: [itConsulting.id, systemIntegration.id, cloudSolutions.id], thematicIds: [digitalTransformation.id, cloudComputing.id] },
  ]

  for (const p of proposalData) {
    const proposal = await db.proposal.create({
      data: {
        name: p.name,
        rfpNumber: p.rfpNumber,
        clientId: p.clientId,
        assignedMemberId: p.assignedMemberId,
        value: p.value,
        status: p.status,
        winningChances: p.winningChances,
        focalPerson: p.focalPerson,
        deadline: p.deadline,
        submissionDate: p.submissionDate,
      },
    })

    if (p.serviceIds.length > 0) {
      await db.proposalService.createMany({
        data: p.serviceIds.map(serviceId => ({ proposalId: proposal.id, serviceId })),
        skipDuplicates: true,
      })
    }

    if (p.thematicIds.length > 0) {
      await db.proposalThematicArea.createMany({
        data: p.thematicIds.map(thematicAreaId => ({ proposalId: proposal.id, thematicAreaId })),
        skipDuplicates: true,
      })
    }
  }

  // ── Settings ──────────────────────────────────────────────
  await db.setting.upsert({
    where: { key: 'companyName' },
    update: { value: 'ECI CRM' },
    create: { key: 'companyName', value: 'ECI CRM' },
  })

  // ── Business Targets ──────────────────────────────────────
  const currentYear = new Date().getFullYear()
  await db.businessTarget.createMany({
    data: [
      { year: currentYear, amount: 150000000, serviceId: managedServices.id },
      { year: currentYear, amount: 80000000, serviceId: dataMigration.id },
      { year: currentYear, amount: 120000000, serviceId: systemIntegration.id },
      { year: currentYear, amount: 60000000, serviceId: itConsulting.id },
      { year: currentYear, amount: 45000000, serviceId: securityAuditing.id },
      { year: currentYear, amount: 95000000, serviceId: cloudSolutions.id },
    ],
    skipDuplicates: true,
  })

  // ── Notifications ─────────────────────────────────────────
  await db.notification.createMany({
    data: [
      { type: 'proposal', title: 'New Proposal Submitted', message: 'PTCL Cloud Solutions Design has been submitted', isRead: false },
      { type: 'deadline', title: 'Upcoming Deadline', message: 'WAPDA Network Monitoring System deadline approaching', isRead: false },
      { type: 'win', title: 'Proposal Won! 🎉', message: 'Engro Digital Transformation proposal has been won', isRead: true },
      { type: 'proposal', title: 'Proposal Status Update', message: 'HBL Data Migration Project moved to In Process', isRead: false },
      { type: 'deadline', title: 'Deadline Tomorrow', message: 'PIA Cybersecurity Assessment deadline is tomorrow', isRead: false },
      { type: 'assignment', title: 'New Assignment', message: 'You have been assigned to OGDCL Software Development Platform', isRead: true },
      { type: 'win', title: 'Proposal Won! 🎉', message: 'NBP Cybersecurity Framework proposal has been won', isRead: true },
      { type: 'proposal', title: 'Proposal Created', message: 'Pakistan Railways Signal System IT proposal has been created', isRead: false },
    ],
  })
}
