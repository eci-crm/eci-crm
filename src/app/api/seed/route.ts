import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Smart seed endpoint: Only seeds if the database is empty.
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
  // ── Services (ECI-specific) ──────────────────────────────
  const researchEvaluation = await db.service.create({ data: { name: 'Research & Evaluation', color: '#3b82f6', sortOrder: 0 } })
  const trainingCapacity = await db.service.create({ data: { name: 'Training & Capacity Building', color: '#10b981', sortOrder: 1 } })
  const materialDevelopment = await db.service.create({ data: { name: 'Material Development', color: '#f59e0b', sortOrder: 2 } })
  const projectManagement = await db.service.create({ data: { name: 'Project Management', color: '#8b5cf6', sortOrder: 3 } })
  const socialMobilization = await db.service.create({ data: { name: 'Social Mobilization', color: '#ef4444', sortOrder: 4 } })
  const mediaCommunications = await db.service.create({ data: { name: 'Media & Communications', color: '#06b6d4', sortOrder: 5 } })

  // ── Thematic Areas ────────────────────────────────────────
  const education = await db.thematicArea.create({ data: { name: 'Education', color: '#3b82f6', sortOrder: 0 } })
  const health = await db.thematicArea.create({ data: { name: 'Health', color: '#ef4444', sortOrder: 1 } })
  const governance = await db.thematicArea.create({ data: { name: 'Governance', color: '#8b5cf6', sortOrder: 2 } })
  const socialProtection = await db.thematicArea.create({ data: { name: 'Social Protection', color: '#10b981', sortOrder: 3 } })
  const economicDevelopment = await db.thematicArea.create({ data: { name: 'Economic Development', color: '#f59e0b', sortOrder: 4 } })
  const environment = await db.thematicArea.create({ data: { name: 'Environment & Climate', color: '#06b6d4', sortOrder: 5 } })
  const genderEquality = await db.thematicArea.create({ data: { name: 'Gender Equality', color: '#ec4899', sortOrder: 6 } })
  const digitalInclusion = await db.thematicArea.create({ data: { name: 'Digital Inclusion', color: '#14b8a6', sortOrder: 7 } })

  // ── Team Members ──────────────────────────────────────────
  const ahmed = await db.teamMember.create({ data: { name: 'Ahmed Khan', email: 'ahmed@ecicrm.pk', role: 'Admin', password: 'admin123', isActive: true } })
  const fatima = await db.teamMember.create({ data: { name: 'Fatima Rizvi', email: 'fatima@ecicrm.pk', role: 'Manager', isActive: true } })
  const ali = await db.teamMember.create({ data: { name: 'Ali Hasan', email: 'ali@ecicrm.pk', role: 'Member', isActive: true } })
  const sana = await db.teamMember.create({ data: { name: 'Sana Mir', email: 'sana@ecicrm.pk', role: 'Member', isActive: true } })
  const usman = await db.teamMember.create({ data: { name: 'Usman Sheikh', email: 'usman@ecicrm.pk', role: 'Viewer', isActive: true } })
  const ayesha = await db.teamMember.create({ data: { name: 'Ayesha Malik', email: 'ayesha@ecicrm.pk', role: 'Member', isActive: false } })

  // ── Clients ───────────────────────────────────────────────
  const undp = await db.client.create({ data: { name: 'UNDP Pakistan', address: 'UN House, Islamabad', status: 'Active' } })
  const worldBank = await db.client.create({ data: { name: 'World Bank', address: 'World Bank Office, Islamabad', status: 'Active' } })
  const unicef = await db.client.create({ data: { name: 'UNICEF Pakistan', address: 'UNICEF Office, Islamabad', status: 'Active' } })
  const dfid = await db.client.create({ data: { name: 'FCDO (formerly DFID)', address: 'British High Commission, Islamabad', status: 'Active' } })
  const usaid = await db.client.create({ data: { name: 'USAID Pakistan', address: 'USAID Office, Islamabad', status: 'Active' } })
  const giz = await db.client.create({ data: { name: 'GIZ Pakistan', address: 'GIZ Office, Islamabad', status: 'Active' } })
  const planningCommission = await db.client.create({ data: { name: 'Planning Commission of Pakistan', address: 'P-Block, Islamabad', status: 'Inactive' } })
  const provincialGovt = await db.client.create({ data: { name: 'Government of Punjab', address: 'Civil Secretariat, Lahore', status: 'Active' } })
  const who = await db.client.create({ data: { name: 'WHO Pakistan', address: 'WHO Office, Islamabad', status: 'Active' } })
  const adb = await db.client.create({ data: { name: 'Asian Development Bank', address: 'ADB Office, Islamabad', status: 'Active' } })

  // ── Proposals ─────────────────────────────────────────────
  const proposalData = [
    { name: 'UNDP Education Sector Assessment', rfpNumber: 'RFP-UNDP-2024-001', clientId: undp.id, assignedMemberId: ahmed.id, value: 12500000, status: 'Won', winningChances: 'High', focalPerson: 'Asif Mehmood', deadline: new Date('2024-03-15'), submissionDate: new Date('2024-03-10'), serviceIds: [researchEvaluation.id, trainingCapacity.id], thematicIds: [education.id, governance.id] },
    { name: 'World Bank Health Systems Evaluation', rfpNumber: 'RFP-WB-2024-001', clientId: worldBank.id, assignedMemberId: fatima.id, value: 18000000, status: 'Won', winningChances: 'High', focalPerson: 'Tariq Javed', deadline: new Date('2024-04-20'), submissionDate: new Date('2024-04-15'), serviceIds: [researchEvaluation.id, projectManagement.id], thematicIds: [health.id, socialProtection.id] },
    { name: 'UNICEF Social Protection Program', rfpNumber: 'RFP-UNICEF-2024-001', clientId: unicef.id, assignedMemberId: ali.id, value: 25000000, status: 'Won', winningChances: 'High', focalPerson: 'Kamran Yousuf', deadline: new Date('2024-05-30'), submissionDate: new Date('2024-05-25'), serviceIds: [socialMobilization.id, trainingCapacity.id], thematicIds: [socialProtection.id, genderEquality.id] },
    { name: 'FCDO Governance Reform Project', rfpNumber: 'RFP-FCDO-2024-001', clientId: dfid.id, assignedMemberId: sana.id, value: 8500000, status: 'Won', winningChances: 'Medium', focalPerson: 'Naveed Anwar', deadline: new Date('2024-06-10'), submissionDate: new Date('2024-06-05'), serviceIds: [researchEvaluation.id, projectManagement.id], thematicIds: [governance.id, economicDevelopment.id] },
    { name: 'USAID Training & Capacity Building', rfpNumber: 'RFP-USAID-2024-001', clientId: usaid.id, assignedMemberId: ahmed.id, value: 15000000, status: 'Won', winningChances: 'High', focalPerson: 'Shahid Iqbal', deadline: new Date('2024-07-15'), submissionDate: new Date('2024-07-10'), serviceIds: [trainingCapacity.id, materialDevelopment.id], thematicIds: [education.id, digitalInclusion.id] },
    { name: 'GIZ Economic Development Study', rfpNumber: 'RFP-GIZ-2024-001', clientId: giz.id, assignedMemberId: fatima.id, value: 20000000, status: 'Won', winningChances: 'High', focalPerson: 'Bilal Ahmed', deadline: new Date('2024-08-20'), submissionDate: new Date('2024-08-15'), serviceIds: [researchEvaluation.id, mediaCommunications.id], thematicIds: [economicDevelopment.id, governance.id] },
    { name: 'UNDP Climate Change Adaptation', rfpNumber: 'RFP-UNDP-2024-002', clientId: undp.id, assignedMemberId: ali.id, value: 9800000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Rashid Khan', deadline: new Date('2024-09-15'), serviceIds: [researchEvaluation.id, projectManagement.id], thematicIds: [environment.id, governance.id] },
    { name: 'WHO Health Communications Campaign', rfpNumber: 'RFP-WHO-2024-001', clientId: who.id, assignedMemberId: sana.id, value: 6200000, status: 'Submitted', winningChances: 'Low', focalPerson: 'Faisal Nawaz', deadline: new Date('2024-09-30'), serviceIds: [mediaCommunications.id, socialMobilization.id], thematicIds: [health.id, socialProtection.id] },
    { name: 'ADB Material Development for Education', rfpNumber: 'RFP-ADB-2024-001', clientId: adb.id, assignedMemberId: ahmed.id, value: 3500000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Zubair Rana', deadline: new Date('2024-10-15'), serviceIds: [materialDevelopment.id, trainingCapacity.id], thematicIds: [education.id] },
    { name: 'World Bank Social Mobilization Initiative', rfpNumber: 'RFP-WB-2024-002', clientId: worldBank.id, assignedMemberId: fatima.id, value: 7200000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Waqar Hassan', deadline: new Date('2024-11-01'), serviceIds: [socialMobilization.id, trainingCapacity.id], thematicIds: [socialProtection.id] },
    { name: 'Punjab Govt Project Management Support', rfpNumber: 'RFP-GoPb-2024-001', clientId: provincialGovt.id, assignedMemberId: ali.id, value: 5500000, status: 'In Process', winningChances: 'Low', focalPerson: 'Imran Siddiqui', deadline: new Date('2024-11-15'), serviceIds: [projectManagement.id], thematicIds: [governance.id] },
    { name: 'UNICEF Gender Equality Program', rfpNumber: 'RFP-UNICEF-2024-002', clientId: unicef.id, assignedMemberId: sana.id, value: 4800000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Ahmed Raza', deadline: new Date('2024-11-30'), serviceIds: [socialMobilization.id, researchEvaluation.id], thematicIds: [genderEquality.id, socialProtection.id] },
    { name: 'USAID Digital Inclusion Research', rfpNumber: 'RFP-USAID-2024-002', clientId: usaid.id, assignedMemberId: ahmed.id, value: 11000000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Salman Farooq', deadline: new Date('2024-12-01'), serviceIds: [researchEvaluation.id, mediaCommunications.id], thematicIds: [digitalInclusion.id, education.id] },
    { name: 'FCDO Health Sector Reform', rfpNumber: 'RFP-FCDO-2024-002', clientId: dfid.id, assignedMemberId: fatima.id, value: 9000000, status: 'In Process', winningChances: 'High', focalPerson: 'Adeel Hashmi', deadline: new Date('2024-12-10'), serviceIds: [researchEvaluation.id, projectManagement.id], thematicIds: [health.id, governance.id] },
    { name: 'GIZ Environmental Assessment', rfpNumber: 'RFP-GIZ-2024-002', clientId: giz.id, assignedMemberId: ali.id, value: 4200000, status: 'In Evaluation', winningChances: 'Low', focalPerson: 'Nasir Mahmood', deadline: new Date('2024-12-20'), serviceIds: [researchEvaluation.id, materialDevelopment.id], thematicIds: [environment.id, economicDevelopment.id] },
    { name: 'UNDP Capacity Building for Governance', rfpNumber: 'RFP-UNDP-2024-003', clientId: undp.id, assignedMemberId: sana.id, value: 14000000, status: 'In Evaluation', winningChances: 'Medium', focalPerson: 'Hassan Zaidi', deadline: new Date('2025-01-10'), serviceIds: [trainingCapacity.id, projectManagement.id], thematicIds: [governance.id, digitalInclusion.id] },
    { name: 'Planning Commission Evaluation Study', rfpNumber: 'RFP-PC-2024-001', clientId: planningCommission.id, assignedMemberId: ahmed.id, value: 2500000, status: 'In Evaluation', winningChances: 'Low', focalPerson: 'Khalid Pervez', deadline: new Date('2025-01-15'), serviceIds: [researchEvaluation.id], thematicIds: [governance.id] },
    { name: 'WHO Media & Communications Strategy', rfpNumber: 'RFP-WHO-2024-002', clientId: who.id, assignedMemberId: null, value: 22000000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-02-01'), serviceIds: [mediaCommunications.id, socialMobilization.id], thematicIds: [health.id, socialProtection.id] },
    { name: 'ADB Education Materials Development', rfpNumber: 'RFP-ADB-2024-002', clientId: adb.id, assignedMemberId: null, value: 3800000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-02-15'), serviceIds: [materialDevelopment.id, trainingCapacity.id], thematicIds: [education.id] },
    { name: 'World Bank Social Protection Phase 2', rfpNumber: 'RFP-WB-2024-003', clientId: worldBank.id, assignedMemberId: null, value: 16000000, status: 'Pending', winningChances: '', focalPerson: '', deadline: new Date('2025-03-01'), serviceIds: [socialMobilization.id, projectManagement.id, researchEvaluation.id], thematicIds: [socialProtection.id, genderEquality.id] },
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
      { year: currentYear, amount: 150000000, serviceId: researchEvaluation.id },
      { year: currentYear, amount: 80000000, serviceId: trainingCapacity.id },
      { year: currentYear, amount: 120000000, serviceId: materialDevelopment.id },
      { year: currentYear, amount: 60000000, serviceId: projectManagement.id },
      { year: currentYear, amount: 45000000, serviceId: socialMobilization.id },
      { year: currentYear, amount: 95000000, serviceId: mediaCommunications.id },
    ],
    skipDuplicates: true,
  })

  // ── Notifications ─────────────────────────────────────────
  await db.notification.createMany({
    data: [
      { type: 'proposal', title: 'New Proposal Submitted', message: 'World Bank Social Mobilization Initiative has been submitted', isRead: false },
      { type: 'deadline', title: 'Upcoming Deadline', message: 'UNICEF Gender Equality Program deadline approaching', isRead: false },
      { type: 'win', title: 'Proposal Won!', message: 'GIZ Economic Development Study proposal has been won', isRead: true },
      { type: 'proposal', title: 'Proposal Status Update', message: 'FCDO Health Sector Reform moved to In Process', isRead: false },
      { type: 'deadline', title: 'Deadline Tomorrow', message: 'GIZ Environmental Assessment deadline is tomorrow', isRead: false },
      { type: 'assignment', title: 'New Assignment', message: 'You have been assigned to USAID Digital Inclusion Research', isRead: true },
      { type: 'win', title: 'Proposal Won!', message: 'World Bank Health Systems Evaluation proposal has been won', isRead: true },
      { type: 'proposal', title: 'Proposal Created', message: 'WHO Media & Communications Strategy proposal has been created', isRead: false },
    ],
  })
}
