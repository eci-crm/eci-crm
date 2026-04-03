import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)
    
    // Get all clients
    const clients = await db.contact.findMany({
      include: {
        proposals: {
          where: {
            OR: [
              { submissionDate: { gte: startOfYear, lte: endOfYear } },
              { createdAt: { gte: startOfYear, lte: endOfYear } }
            ]
          }
        }
      }
    })
    
    // Get all proposals for the year
    const proposals = await db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: startOfYear, lte: endOfYear } },
          { createdAt: { gte: startOfYear, lte: endOfYear } }
        ]
      },
      include: {
        contact: { select: { id: true, name: true, company: true, sector: true } }
      }
    })
    
    // Client statistics - which clients give most opportunities
    const clientStats = clients.map(client => {
      const clientProposals = proposals.filter(p => p.contactId === client.id)
      const accepted = clientProposals.filter(p => p.stage === 'ACCEPTED')
      const rejected = clientProposals.filter(p => p.stage === 'REJECTED')
      const pending = clientProposals.filter(p => ['NEW', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_EVALUATION'].includes(p.stage))
      
      return {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        sector: client.sector,
        status: client.status,
        totalProposals: clientProposals.length,
        accepted: accepted.length,
        rejected: rejected.length,
        pending: pending.length,
        totalValuePKR: clientProposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0),
        totalValueUSD: clientProposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0),
        wonValuePKR: accepted.reduce((sum, p) => sum + (p.valuePKR || 0), 0),
        wonValueUSD: accepted.reduce((sum, p) => sum + (p.valueUSD || 0), 0),
        winRate: clientProposals.length > 0 
          ? Math.round((accepted.length / clientProposals.length) * 100) 
          : 0
      }
    }).sort((a, b) => b.totalProposals - a.totalProposals)
    
    // Top clients by opportunities
    const topClientsByOpportunities = clientStats
      .filter(c => c.totalProposals > 0)
      .slice(0, 10)
    
    // Top clients by value
    const topClientsByValue = [...clientStats]
      .filter(c => c.wonValuePKR > 0)
      .sort((a, b) => b.wonValuePKR - a.wonValuePKR)
      .slice(0, 10)
    
    // Sector statistics
    const sectorStats = new Map<string, {
      sector: string
      clients: number
      proposals: number
      accepted: number
      rejected: number
      totalValuePKR: number
      wonValuePKR: number
    }>()
    
    proposals.forEach(p => {
      const sector = p.sector || p.contact?.sector || 'Unknown'
      const existing = sectorStats.get(sector)
      if (existing) {
        existing.proposals++
        existing.totalValuePKR += p.valuePKR || 0
        if (p.stage === 'ACCEPTED') {
          existing.accepted++
          existing.wonValuePKR += p.valuePKR || 0
        }
        if (p.stage === 'REJECTED') existing.rejected++
      } else {
        sectorStats.set(sector, {
          sector,
          clients: 0,
          proposals: 1,
          accepted: p.stage === 'ACCEPTED' ? 1 : 0,
          rejected: p.stage === 'REJECTED' ? 1 : 0,
          totalValuePKR: p.valuePKR || 0,
          wonValuePKR: p.stage === 'ACCEPTED' ? (p.valuePKR || 0) : 0
        })
      }
    })
    
    // Count clients per sector
    clients.forEach(client => {
      const sector = client.sector || 'Unknown'
      const existing = sectorStats.get(sector)
      if (existing) existing.clients++
    })
    
    const sectorAnalysis = Array.from(sectorStats.values())
      .map(s => ({
        ...s,
        successRate: s.proposals > 0 ? Math.round((s.accepted / s.proposals) * 100) : 0,
        averageValuePKR: s.proposals > 0 ? Math.round(s.totalValuePKR / s.proposals) : 0
      }))
      .sort((a, b) => b.proposals - a.proposals)
    
    // Sector success rate ranking
    const sectorSuccessRates = sectorAnalysis
      .filter(s => s.proposals >= 2) // Only sectors with at least 2 proposals
      .sort((a, b) => b.successRate - a.successRate)
    
    // Client status distribution
    const statusDistribution = [
      { status: 'Lead', count: clients.filter(c => c.status === 'LEAD').length },
      { status: 'Prospect', count: clients.filter(c => c.status === 'PROSPECT').length },
      { status: 'Customer', count: clients.filter(c => c.status === 'CUSTOMER').length }
    ]
    
    return NextResponse.json({
      year,
      summary: {
        totalClients: clients.length,
        totalProposals: proposals.length,
        totalSectors: sectorStats.size,
        averageProposalsPerClient: clients.length > 0 
          ? (proposals.length / clients.length).toFixed(1) 
          : 0
      },
      topClientsByOpportunities,
      topClientsByValue,
      sectorAnalysis,
      sectorSuccessRates,
      statusDistribution,
      clientStats
    })
  } catch (error) {
    console.error('Error generating client report:', error)
    return NextResponse.json({ error: 'Failed to generate client report' }, { status: 500 })
  }
}
