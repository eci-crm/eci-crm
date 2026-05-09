import { db } from './src/lib/db'

async function main() {
  console.log('🌱 Starting database seed...')

  await db.$connect()

  // ── Clean existing data in reverse dependency order ──────────────────
  console.log('🧹 Cleaning existing data...')
  await db.proposalThematicArea.deleteMany()
  await db.proposalService.deleteMany()
  await db.proposal.deleteMany()
  await db.businessTarget.deleteMany()
  await db.notification.deleteMany()
  await db.activityLog.deleteMany()
  await db.chatMessage.deleteMany()
  await db.resource.deleteMany()
  await db.resourceFolder.deleteMany()
  await db.setting.deleteMany()
  await db.client.deleteMany()
  await db.teamMember.deleteMany()
  await db.thematicArea.deleteMany()
  await db.service.deleteMany()
  console.log('✅ Existing data cleaned.')

  // ── Team Members ─────────────────────────────────────────────────────
  console.log('👤 Seeding team members...')
  const members = await Promise.all([
    db.teamMember.create({ data: { name: 'Ahmed Khan', email: 'ahmed@crmpro.pk', password: 'admin123', role: 'Admin', isActive: true } }),
    db.teamMember.create({ data: { name: 'Sarah Ali', email: 'sarah@crmpro.pk', password: 'manager123', role: 'Manager', isActive: true } }),
    db.teamMember.create({ data: { name: 'Usman Malik', email: 'usman@crmpro.pk', password: 'manager123', role: 'Manager', isActive: true } }),
    db.teamMember.create({ data: { name: 'Fatima Noor', email: 'fatima@crmpro.pk', password: 'member123', role: 'Member', isActive: true } }),
    db.teamMember.create({ data: { name: 'Hassan Raza', email: 'hassan@crmpro.pk', password: 'member123', role: 'Member', isActive: true } }),
    db.teamMember.create({ data: { name: 'Aisha Butt', email: 'aisha@crmpro.pk', password: 'viewer123', role: 'Viewer', isActive: true } }),
  ])
  const [ahmed, sarah, usman, fatima, hassan, aisha] = members

  // ── Thematic Areas ───────────────────────────────────────────────────
  console.log('🏷️  Seeding thematic areas...')
  const areas = await Promise.all([
    db.thematicArea.create({ data: { name: 'Information Technology', color: '#3b82f6', sortOrder: 1 } }),
    db.thematicArea.create({ data: { name: 'Cybersecurity', color: '#ef4444', sortOrder: 2 } }),
    db.thematicArea.create({ data: { name: 'Cloud Infrastructure', color: '#8b5cf6', sortOrder: 3 } }),
    db.thematicArea.create({ data: { name: 'ERP Solutions', color: '#f59e0b', sortOrder: 4 } }),
    db.thematicArea.create({ data: { name: 'Data Analytics', color: '#10b981', sortOrder: 5 } }),
    db.thematicArea.create({ data: { name: 'Network Infrastructure', color: '#06b6d4', sortOrder: 6 } }),
    db.thematicArea.create({ data: { name: 'Software Development', color: '#ec4899', sortOrder: 7 } }),
    db.thematicArea.create({ data: { name: 'Digital Transformation', color: '#f97316', sortOrder: 8 } }),
  ])
  const [itArea, cyberArea, cloudArea, erpArea, dataArea, networkArea, softDevArea, digitalArea] = areas

  // ── Services ─────────────────────────────────────────────────────────
  console.log('🛠️  Seeding services...')
  const services = await Promise.all([
    db.service.create({ data: { name: 'IT Consulting', color: '#10b981', sortOrder: 1 } }),
    db.service.create({ data: { name: 'System Integration', color: '#3b82f6', sortOrder: 2 } }),
    db.service.create({ data: { name: 'Managed Services', color: '#8b5cf6', sortOrder: 3 } }),
    db.service.create({ data: { name: 'Cloud Solutions', color: '#06b6d4', sortOrder: 4 } }),
    db.service.create({ data: { name: 'Security Auditing', color: '#ef4444', sortOrder: 5 } }),
    db.service.create({ data: { name: 'Data Migration', color: '#f59e0b', sortOrder: 6 } }),
  ])
  const [itConsulting, sysIntegration, managedSvc, cloudSolutions, secAudit, dataMigration] = services

  // ── Clients ──────────────────────────────────────────────────────────
  console.log('🏢 Seeding clients...')
  const clients = await Promise.all([
    db.client.create({ data: { name: 'PTCL', address: 'G-8/2, Islamabad', status: 'Active' } }),
    db.client.create({ data: { name: 'National Bank of Pakistan', address: 'I.I. Chundrigar Road, Karachi', status: 'Active' } }),
    db.client.create({ data: { name: 'WAPDA', address: 'WAPDA House, Lahore', status: 'Active' } }),
    db.client.create({ data: { name: 'PIA', address: 'PIA Building, Karachi', status: 'Active' } }),
    db.client.create({ data: { name: 'Sui Southern Gas', address: 'Sir Shah Suleman Road, Karachi', status: 'Active' } }),
    db.client.create({ data: { name: 'Pakistan Railways', address: 'Railway Headquarters, Lahore', status: 'Inactive' } }),
    db.client.create({ data: { name: 'OGDCL', address: 'Jinnah Avenue, Islamabad', status: 'Active' } }),
    db.client.create({ data: { name: 'HBL', address: 'HBL Plaza, Karachi', status: 'Active' } }),
    db.client.create({ data: { name: 'Engro Corporation', address: '24th Floor, The Harbour Front, Karachi', status: 'Active' } }),
    db.client.create({ data: { name: 'Lucky Cement', address: 'Clifton, Karachi', status: 'Active' } }),
  ])
  const [ptcl, nbp, wapda, pia, ssgc, railways, ogdcl, hbl, engro, lucky] = clients

  // ── Proposals ────────────────────────────────────────────────────────
  console.log('📄 Seeding proposals...')
  const proposalDefs: Array<{
    name: string
    rfpNumber: string
    clientIndex: number
    memberIndex: number | null
    value: number
    status: string
    winningChances: string
    focalPerson: string
    deadline: Date | null
    submissionDate: Date | null
    followUpDate: Date | null
    remarks: string
    areaIndices: number[]
    serviceIndices: number[]
  }> = [
    // ── Won (6) — submission dates spread across months ──
    {
      name: 'PTCL Network Modernization', rfpNumber: 'RFP-2025-001', clientIndex: 0, memberIndex: 0,
      value: 12_500_000, status: 'Won', winningChances: 'High', focalPerson: 'Tariq Mehmood',
      deadline: new Date('2025-01-15'), submissionDate: new Date('2025-01-10'), followUpDate: new Date('2025-02-01'),
      remarks: 'Successfully won the network modernization contract.', areaIndices: [5, 2], serviceIndices: [3, 1],
    },
    {
      name: 'NBP Cybersecurity Framework', rfpNumber: 'RFP-2025-005', clientIndex: 1, memberIndex: 1,
      value: 18_000_000, status: 'Won', winningChances: 'High', focalPerson: 'Adeel Hashmi',
      deadline: new Date('2025-03-01'), submissionDate: new Date('2025-02-25'), followUpDate: new Date('2025-03-15'),
      remarks: 'Comprehensive cybersecurity implementation won.', areaIndices: [1, 0], serviceIndices: [4, 0],
    },
    {
      name: 'WAPDA ERP Implementation', rfpNumber: 'RFP-2025-010', clientIndex: 2, memberIndex: 2,
      value: 25_000_000, status: 'Won', winningChances: 'High', focalPerson: 'Shahid Iqbal',
      deadline: new Date('2025-04-20'), submissionDate: new Date('2025-04-15'), followUpDate: new Date('2025-05-10'),
      remarks: 'Large-scale ERP rollout approved.', areaIndices: [3, 0], serviceIndices: [1, 5],
    },
    {
      name: 'OGDCL Data Analytics Platform', rfpNumber: 'RFP-2025-015', clientIndex: 6, memberIndex: 0,
      value: 8_500_000, status: 'Won', winningChances: 'Medium', focalPerson: 'Naveed Anwar',
      deadline: new Date('2025-06-10'), submissionDate: new Date('2025-06-05'), followUpDate: new Date('2025-07-01'),
      remarks: 'Analytics platform contract secured.', areaIndices: [4, 7], serviceIndices: [0, 5],
    },
    {
      name: 'HBL Cloud Migration', rfpNumber: 'RFP-2025-019', clientIndex: 7, memberIndex: 1,
      value: 15_000_000, status: 'Won', winningChances: 'High', focalPerson: 'Kamran Rizvi',
      deadline: new Date('2025-08-30'), submissionDate: new Date('2025-08-20'), followUpDate: new Date('2025-09-15'),
      remarks: 'Cloud migration project awarded to us.', areaIndices: [2, 0], serviceIndices: [3, 5],
    },
    {
      name: 'Engro Digital Transformation', rfpNumber: 'RFP-2025-022', clientIndex: 8, memberIndex: 2,
      value: 20_000_000, status: 'Won', winningChances: 'High', focalPerson: 'Fahad Sheikh',
      deadline: new Date('2025-10-01'), submissionDate: new Date('2025-09-28'), followUpDate: new Date('2025-10-20'),
      remarks: 'Enterprise digital transformation initiative won.', areaIndices: [7, 4], serviceIndices: [0, 1],
    },

    // ── Submitted (3) ──
    {
      name: 'PIA IT Infrastructure Upgrade', rfpNumber: 'RFP-2025-025', clientIndex: 3, memberIndex: 3,
      value: 9_800_000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Asif Javed',
      deadline: new Date('2025-11-15'), submissionDate: new Date('2025-11-10'), followUpDate: new Date('2025-12-01'),
      remarks: 'Proposal submitted, awaiting evaluation.', areaIndices: [0, 5], serviceIndices: [1, 2],
    },
    {
      name: 'SSGC Managed IT Services', rfpNumber: 'RFP-2025-027', clientIndex: 4, memberIndex: 4,
      value: 6_200_000, status: 'Submitted', winningChances: 'Low', focalPerson: 'Bilal Khan',
      deadline: new Date('2025-12-01'), submissionDate: new Date('2025-11-28'), followUpDate: new Date('2025-12-15'),
      remarks: 'Submitted for managed services engagement.', areaIndices: [0, 1], serviceIndices: [2, 0],
    },
    {
      name: 'Lucky Cement Security Audit', rfpNumber: 'RFP-2026-002', clientIndex: 9, memberIndex: 3,
      value: 3_500_000, status: 'Submitted', winningChances: 'Medium', focalPerson: 'Danish Akhtar',
      deadline: new Date('2026-01-20'), submissionDate: new Date('2026-01-15'), followUpDate: new Date('2026-02-05'),
      remarks: 'Security audit proposal submitted.', areaIndices: [1], serviceIndices: [4],
    },

    // ── In Process (5) ──
    {
      name: 'PTCL Cloud Solutions Design', rfpNumber: 'RFP-2025-030', clientIndex: 0, memberIndex: 1,
      value: 7_200_000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Tariq Mehmood',
      deadline: new Date('2026-02-15'), submissionDate: null, followUpDate: new Date('2026-01-25'),
      remarks: 'Working on cloud architecture proposal.', areaIndices: [2, 0], serviceIndices: [3, 0],
    },
    {
      name: 'NBP ERP Module Extension', rfpNumber: 'RFP-2025-032', clientIndex: 1, memberIndex: 2,
      value: 5_500_000, status: 'In Process', winningChances: 'High', focalPerson: 'Adeel Hashmi',
      deadline: new Date('2026-03-01'), submissionDate: null, followUpDate: new Date('2026-02-10'),
      remarks: 'Extending ERP modules for HR and Finance.', areaIndices: [3], serviceIndices: [1, 5],
    },
    {
      name: 'WAPDA Network Monitoring System', rfpNumber: 'RFP-2025-035', clientIndex: 2, memberIndex: 3,
      value: 4_800_000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Shahid Iqbal',
      deadline: new Date('2026-03-15'), submissionDate: null, followUpDate: new Date('2026-02-20'),
      remarks: 'Network monitoring and alerting system proposal.', areaIndices: [5, 1], serviceIndices: [2, 4],
    },
    {
      name: 'OGDCL Software Development Platform', rfpNumber: 'RFP-2025-038', clientIndex: 6, memberIndex: 4,
      value: 11_000_000, status: 'In Process', winningChances: 'Low', focalPerson: 'Naveed Anwar',
      deadline: new Date('2026-04-01'), submissionDate: null, followUpDate: new Date('2026-03-10'),
      remarks: 'Custom software platform for field operations.', areaIndices: [6, 4], serviceIndices: [0, 1],
    },
    {
      name: 'HBL Data Migration Project', rfpNumber: 'RFP-2025-041', clientIndex: 7, memberIndex: 0,
      value: 9_000_000, status: 'In Process', winningChances: 'Medium', focalPerson: 'Kamran Rizvi',
      deadline: new Date('2026-04-20'), submissionDate: null, followUpDate: new Date('2026-03-25'),
      remarks: 'Legacy data migration to new platform.', areaIndices: [0, 4], serviceIndices: [5, 0],
    },

    // ── In Evaluation (3) ──
    {
      name: 'PIA Cybersecurity Assessment', rfpNumber: 'RFP-2025-044', clientIndex: 3, memberIndex: 1,
      value: 4_200_000, status: 'In Evaluation', winningChances: 'High', focalPerson: 'Asif Javed',
      deadline: new Date('2026-02-28'), submissionDate: new Date('2026-02-20'), followUpDate: new Date('2026-03-10'),
      remarks: 'Under technical evaluation by PIA committee.', areaIndices: [1, 0], serviceIndices: [4, 0],
    },
    {
      name: 'Engro Cloud Infrastructure Setup', rfpNumber: 'RFP-2025-047', clientIndex: 8, memberIndex: 2,
      value: 14_000_000, status: 'In Evaluation', winningChances: 'Medium', focalPerson: 'Fahad Sheikh',
      deadline: new Date('2026-03-10'), submissionDate: new Date('2026-03-01'), followUpDate: new Date('2026-03-20'),
      remarks: 'Cloud infrastructure proposal under review.', areaIndices: [2, 7], serviceIndices: [3, 1],
    },
    {
      name: 'Lucky Cement IT Consulting', rfpNumber: 'RFP-2025-050', clientIndex: 9, memberIndex: 3,
      value: 2_500_000, status: 'In Evaluation', winningChances: 'Low', focalPerson: 'Danish Akhtar',
      deadline: new Date('2026-03-20'), submissionDate: new Date('2026-03-10'), followUpDate: new Date('2026-04-01'),
      remarks: 'IT strategy consulting engagement under evaluation.', areaIndices: [0, 7], serviceIndices: [0],
    },

    // ── Pending (3) ──
    {
      name: 'Pakistan Railways Signal System IT', rfpNumber: 'RFP-2025-052', clientIndex: 5, memberIndex: null,
      value: 22_000_000, status: 'Pending', winningChances: 'Low', focalPerson: '',
      deadline: new Date('2026-05-01'), submissionDate: null, followUpDate: null,
      remarks: 'Awaiting client confirmation on scope. Client currently inactive.', areaIndices: [0, 5, 6], serviceIndices: [1, 2],
    },
    {
      name: 'SSGC Data Analytics Dashboard', rfpNumber: 'RFP-2025-055', clientIndex: 4, memberIndex: 4,
      value: 3_800_000, status: 'Pending', winningChances: 'Medium', focalPerson: 'Bilal Khan',
      deadline: new Date('2026-04-15'), submissionDate: null, followUpDate: new Date('2026-03-30'),
      remarks: 'Waiting for internal approvals at SSGC.', areaIndices: [4, 7], serviceIndices: [0, 5],
    },
    {
      name: 'PTCL Digital Transformation Phase 2', rfpNumber: 'RFP-2025-058', clientIndex: 0, memberIndex: null,
      value: 16_000_000, status: 'Pending', winningChances: 'High', focalPerson: 'Tariq Mehmood',
      deadline: new Date('2026-06-01'), submissionDate: null, followUpDate: new Date('2026-04-20'),
      remarks: 'Follow-on project from Phase 1. Awaiting RFP release.', areaIndices: [7, 0, 2], serviceIndices: [0, 3],
    },
  ]

  const createdProposals = []
  for (const def of proposalDefs) {
    const proposal = await db.proposal.create({
      data: {
        name: def.name,
        rfpNumber: def.rfpNumber,
        clientId: clients[def.clientIndex].id,
        assignedMemberId: def.memberIndex !== null ? members[def.memberIndex].id : null,
        value: def.value,
        status: def.status,
        winningChances: def.winningChances,
        focalPerson: def.focalPerson,
        deadline: def.deadline,
        submissionDate: def.submissionDate,
        followUpDate: def.followUpDate,
        remarks: def.remarks,
      },
    })
    createdProposals.push(proposal)

    // Create thematic area junctions
    for (const areaIdx of def.areaIndices) {
      await db.proposalThematicArea.create({
        data: {
          proposalId: proposal.id,
          thematicAreaId: areas[areaIdx].id,
        },
      })
    }

    // Create service junctions
    for (const svcIdx of def.serviceIndices) {
      await db.proposalService.create({
        data: {
          proposalId: proposal.id,
          serviceId: services[svcIdx].id,
        },
      })
    }
  }
  console.log(`✅ ${createdProposals.length} proposals seeded.`)

  // ── Business Targets ─────────────────────────────────────────────────
  console.log('🎯 Seeding business targets...')

  // Annual overall target for 2025
  await db.businessTarget.create({
    data: { year: 2025, month: null, amount: 100_000_000, serviceId: null },
  })

  // Monthly targets for 2025 (roughly 8,333,333 each)
  const monthlyAmount = Math.round(100_000_000 / 12)
  for (let m = 1; m <= 12; m++) {
    await db.businessTarget.create({
      data: { year: 2025, month: m, amount: monthlyAmount, serviceId: null },
    })
  }

  // Service-specific targets
  await db.businessTarget.create({
    data: { year: 2025, month: null, amount: 25_000_000, serviceId: itConsulting.id },
  })
  await db.businessTarget.create({
    data: { year: 2025, month: null, amount: 20_000_000, serviceId: cloudSolutions.id },
  })

  console.log('✅ Business targets seeded.')

  // ── Notifications ────────────────────────────────────────────────────
  console.log('🔔 Seeding notifications...')
  await Promise.all([
    db.notification.create({
      data: {
        type: 'deadline',
        title: 'Proposal Deadline Approaching',
        message: 'PTCL Cloud Solutions Design deadline is in 5 days. Please ensure all documents are ready.',
        isRead: false,
        userId: sarah.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'follow_up',
        title: 'Follow-Up Required',
        message: 'Follow-up with NBP regarding the ERP Module Extension proposal is due today.',
        isRead: false,
        userId: usman.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'status_change',
        title: 'Proposal Status Updated',
        message: 'HBL Cloud Migration proposal status has been changed to Won. Congratulations!',
        isRead: true,
        userId: ahmed.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'target',
        title: 'Monthly Target Update',
        message: 'January 2025 target achievement: 112%. Great start to the year!',
        isRead: true,
        userId: null,
        link: '/reports',
      },
    }),
    db.notification.create({
      data: {
        type: 'info',
        title: 'New RFP Published',
        message: 'Pakistan Railways has published a new RFP for Signal System IT. Consider preparing a proposal.',
        isRead: false,
        userId: ahmed.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'deadline',
        title: 'Urgent: Deadline Tomorrow',
        message: 'PIA Cybersecurity Assessment proposal deadline is tomorrow. Final review needed.',
        isRead: false,
        userId: sarah.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'status_change',
        title: 'Proposal Moved to Evaluation',
        message: 'Engro Cloud Infrastructure Setup has moved to In Evaluation stage.',
        isRead: false,
        userId: usman.id,
        link: '/proposals',
      },
    }),
    db.notification.create({
      data: {
        type: 'target',
        title: 'Quarterly Target Review',
        message: 'Q1 2025 closed at 95% of target. Review the quarterly report for details.',
        isRead: true,
        userId: null,
        link: '/reports',
      },
    }),
  ])
  console.log('✅ Notifications seeded.')

  // ── Settings ─────────────────────────────────────────────────────────
  console.log('⚙️  Seeding settings...')
  await db.setting.create({
    data: { key: 'companyName', value: 'CRM Pro' },
  })
  console.log('✅ Settings seeded.')

  // ── Summary ──────────────────────────────────────────────────────────
  const counts = {
    teamMembers: await db.teamMember.count(),
    thematicAreas: await db.thematicArea.count(),
    services: await db.service.count(),
    clients: await db.client.count(),
    proposals: await db.proposal.count(),
    proposalThematicAreas: await db.proposalThematicArea.count(),
    proposalServices: await db.proposalService.count(),
    businessTargets: await db.businessTarget.count(),
    notifications: await db.notification.count(),
    settings: await db.setting.count(),
  }
  console.log('\n📊 Seed Summary:')
  console.log(`   Team Members:        ${counts.teamMembers}`)
  console.log(`   Thematic Areas:      ${counts.thematicAreas}`)
  console.log(`   Services:            ${counts.services}`)
  console.log(`   Clients:             ${counts.clients}`)
  console.log(`   Proposals:           ${counts.proposals}`)
  console.log(`   Proposal Areas:      ${counts.proposalThematicAreas}`)
  console.log(`   Proposal Services:   ${counts.proposalServices}`)
  console.log(`   Business Targets:    ${counts.businessTargets}`)
  console.log(`   Notifications:       ${counts.notifications}`)
  console.log(`   Settings:            ${counts.settings}`)
  console.log('\n🎉 Seed completed successfully!')

  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  db.$disconnect()
  process.exit(1)
})
