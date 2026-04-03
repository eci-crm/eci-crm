import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Check if already set up
    const existingUsers = await db.user.count()
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        message: 'Database already set up',
        status: 'already_setup',
        userCount: existingUsers
      })
    }
    
    // Create default admin user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const admin = await db.user.create({
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
    
    const users = await db.user.createMany({
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
    
    // Create resource categories
    const categories = await db.resourceCategory.createMany({
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
    
    // Create demo clients
    const dbUsers = await db.user.findMany()
    const adminUser = dbUsers.find(u => u.email === 'admin@ecicrm.com')
    
    if (adminUser) {
      await db.contact.createMany({
        data: [
          {
            name: 'Muhammad Usman',
            email: 'usman@techcorp.pk',
            phone: '+92-300-1234567',
            company: 'TechCorp Pakistan',
            position: 'CEO',
            sector: 'Technology',
            status: 'CLIENT',
            source: 'Website',
            ownerId: adminUser.id
          },
          {
            name: 'Fatima Zahra',
            email: 'fatima@govt.gov.pk',
            phone: '+92-51-9876543',
            company: 'Ministry of IT',
            position: 'Director',
            sector: 'Government',
            status: 'PROSPECT',
            source: 'RFP',
            ownerId: adminUser.id
          },
          {
            name: 'Ali Raza',
            email: 'ali@construction.com',
            phone: '+92-321-5551234',
            company: 'BuildRight Construction',
            position: 'Procurement Manager',
            sector: 'Construction',
            status: 'LEAD',
            source: 'Referral',
            ownerId: adminUser.id
          },
          {
            name: 'Ayesha Siddiqui',
            email: 'ayesha@bankalfalah.com',
            phone: '+92-42-35678901',
            company: 'Bank Alfalah',
            position: 'IT Head',
            sector: 'Banking',
            status: 'CLIENT',
            source: 'Conference',
            ownerId: adminUser.id
          },
          {
            name: 'Imran Hashmi',
            email: 'imran@healthplus.pk',
            phone: '+92-300-9998887',
            company: 'HealthPlus Hospitals',
            position: 'Administrator',
            sector: 'Healthcare',
            status: 'PROSPECT',
            source: 'Cold Call',
            ownerId: adminUser.id
          }
        ]
      })
      
      // Get created contacts
      const contacts = await db.contact.findMany()
      
      // Create demo proposals
      const techCorp = contacts.find(c => c.company === 'TechCorp Pakistan')
      const ministry = contacts.find(c => c.company === 'Ministry of IT')
      const bank = contacts.find(c => c.company === 'Bank Alfalah')
      const buildRight = contacts.find(c => c.company === 'BuildRight Construction')
      const healthPlus = contacts.find(c => c.company === 'HealthPlus Hospitals')
      
      if (techCorp) {
        await db.proposal.create({
          data: {
            title: 'Enterprise Software Development',
            description: 'Custom enterprise software solution for business operations',
            rfpNumber: 'TC-2024-001',
            valuePKR: 15000000,
            valueUSD: 54000,
            currency: 'PKR',
            status: 'ACTIVE',
            stage: 'ACCEPTED',
            submissionDate: new Date('2024-01-15'),
            deadline: new Date('2024-01-10'),
            submissionMethod: 'EMAIL',
            ownerId: adminUser.id,
            contactId: techCorp.id,
            sector: 'Technology',
            internalRemarks: 'Project completed successfully',
            externalRemarks: 'Client very satisfied'
          }
        })
      }
      
      if (ministry) {
        await db.proposal.create({
          data: {
            title: 'E-Government Portal Development',
            description: 'Digital transformation portal for government services',
            rfpNumber: 'MOIT-2024-045',
            valuePKR: 50000000,
            valueUSD: 180000,
            currency: 'PKR',
            status: 'ACTIVE',
            stage: 'UNDER_EVALUATION',
            submissionDate: new Date('2024-02-20'),
            deadline: new Date('2024-02-15'),
            submissionMethod: 'PORTAL',
            ownerId: adminUser.id,
            contactId: ministry.id,
            sector: 'Government',
            internalRemarks: 'Submitted on time, awaiting evaluation'
          }
        })
      }
      
      if (bank) {
        await db.proposal.create({
          data: {
            title: 'Core Banking System Upgrade',
            description: 'Modernization of core banking infrastructure',
            rfpNumber: 'BA-IT-2024-12',
            valuePKR: 75000000,
            valueUSD: 270000,
            currency: 'PKR',
            status: 'ACTIVE',
            stage: 'SUBMITTED',
            submissionDate: new Date('2024-03-01'),
            deadline: new Date('2024-02-28'),
            submissionMethod: 'EMAIL',
            ownerId: adminUser.id,
            contactId: bank.id,
            sector: 'Banking'
          }
        })
      }
      
      if (buildRight) {
        await db.proposal.create({
          data: {
            title: 'Construction Management System',
            description: 'Project management solution for construction industry',
            rfpNumber: 'BR-2024-08',
            valuePKR: 8000000,
            valueUSD: 29000,
            currency: 'PKR',
            status: 'ACTIVE',
            stage: 'IN_PROGRESS',
            ownerId: adminUser.id,
            contactId: buildRight.id,
            sector: 'Construction'
          }
        })
      }
      
      if (healthPlus) {
        await db.proposal.create({
          data: {
            title: 'Hospital Management System',
            description: 'Complete hospital management and patient records system',
            rfpNumber: 'HP-IT-2024-03',
            valuePKR: 25000000,
            valueUSD: 90000,
            currency: 'PKR',
            status: 'ACTIVE',
            stage: 'NEW',
            deadline: new Date('2024-04-15'),
            ownerId: adminUser.id,
            contactId: healthPlus.id,
            sector: 'Healthcare'
          }
        })
      }
      
      // Create demo tasks
      const ahmed = dbUsers.find(u => u.email === 'ahmed@ecicrm.com')
      const sarah = dbUsers.find(u => u.email === 'sarah@ecicrm.com')
      
      if (ahmed) {
        await db.task.createMany({
          data: [
            {
              title: 'Follow up with Ministry of IT',
              description: 'Check evaluation status of e-government portal proposal',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              assigneeId: ahmed.id
            },
            {
              title: 'Prepare quarterly report',
              description: 'Generate Q1 2024 proposal performance report',
              status: 'TODO',
              priority: 'MEDIUM',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              assigneeId: ahmed.id
            }
          ]
        })
      }
      
      if (sarah) {
        await db.task.createMany({
          data: [
            {
              title: 'Technical documentation for Bank Alfalah',
              description: 'Prepare technical specs for core banking upgrade',
              status: 'IN_PROGRESS',
              priority: 'URGENT',
              dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
              assigneeId: sarah.id
            },
            {
              title: 'Review proposal templates',
              description: 'Update standard proposal templates',
              status: 'TODO',
              priority: 'LOW',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              assigneeId: sarah.id
            }
          ]
        })
      }
    }
    
    return NextResponse.json({ 
      message: 'Database setup completed successfully!',
      status: 'success',
      created: {
        users: existingUsers === 0 ? 4 : 0,
        categories: 8,
        demoData: true
      },
      login: {
        email: 'admin@ecicrm.com',
        password: 'password123'
      }
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
