import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let filterStart: Date
    let filterEnd: Date
    
    if (startDate && endDate) {
      // Custom date range
      filterStart = new Date(startDate)
      filterEnd = new Date(endDate)
      filterEnd.setHours(23, 59, 59, 999)
    } else if (month) {
      // Monthly filter
      filterStart = new Date(year, month - 1, 1)
      filterEnd = new Date(year, month, 0, 23, 59, 59, 999)
    } else {
      // Yearly filter (default)
      filterStart = new Date(year, 0, 1)
      filterEnd = new Date(year, 11, 31, 23, 59, 59, 999)
    }
    
    const proposals = await db.proposal.findMany({
      where: {
        OR: [
          { submissionDate: { gte: filterStart, lte: filterEnd } },
          { createdAt: { gte: filterStart, lte: filterEnd } }
        ]
      },
      include: {
        contact: { select: { id: true, name: true, company: true, sector: true } },
        owner: { select: { id: true, name: true, department: true } },
        teamMembers: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Summary Statistics
    const totalSubmitted = proposals.filter(p => 
      ['SUBMITTED', 'UNDER_EVALUATION', 'ACCEPTED', 'REJECTED'].includes(p.stage)
    ).length
    
    const accepted = proposals.filter(p => p.stage === 'ACCEPTED')
    const rejected = proposals.filter(p => p.stage === 'REJECTED')
    const inEvaluation = proposals.filter(p => p.stage === 'UNDER_EVALUATION')
    const draft = proposals.filter(p => ['NEW', 'DRAFT', 'IN_PROGRESS'].includes(p.stage))
    
    const totalValuePKR = proposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0)
    const totalValueUSD = proposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
    const wonValuePKR = accepted.reduce((sum, p) => sum + (p.valuePKR || 0), 0)
    const wonValueUSD = accepted.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
    
    const winRate = totalSubmitted > 0 ? Math.round((accepted.length / totalSubmitted) * 100) : 0
    
    // Monthly breakdown (for yearly view)
    const monthlyData = Array(12).fill(0).map((_, i) => {
      const monthProposals = proposals.filter(p => {
        const date = p.submissionDate || p.createdAt
        return date && new Date(date).getMonth() === i
      })
      const monthAccepted = monthProposals.filter(p => p.stage === 'ACCEPTED')
      const monthRejected = monthProposals.filter(p => p.stage === 'REJECTED')
      
      return {
        month: new Date(year, i).toLocaleString('default', { month: 'short' }),
        submitted: monthProposals.length,
        accepted: monthAccepted.length,
        rejected: monthRejected.length,
        valuePKR: monthProposals.reduce((sum, p) => sum + (p.valuePKR || 0), 0),
        valueUSD: monthProposals.reduce((sum, p) => sum + (p.valueUSD || 0), 0),
        wonValuePKR: monthAccepted.reduce((sum, p) => sum + (p.valuePKR || 0), 0),
        wonValueUSD: monthAccepted.reduce((sum, p) => sum + (p.valueUSD || 0), 0)
      }
    })
    
    // Status breakdown
    const statusBreakdown = [
      { status: 'Draft', count: draft.length, valuePKR: draft.reduce((s, p) => s + (p.valuePKR || 0), 0) },
      { status: 'Submitted', count: proposals.filter(p => p.stage === 'SUBMITTED').length, valuePKR: 0 },
      { status: 'Under Evaluation', count: inEvaluation.length, valuePKR: inEvaluation.reduce((s, p) => s + (p.valuePKR || 0), 0) },
      { status: 'Accepted', count: accepted.length, valuePKR: wonValuePKR },
      { status: 'Rejected', count: rejected.length, valuePKR: rejected.reduce((s, p) => s + (p.valuePKR || 0), 0) }
    ]
    
    // Value analysis
    const averageDealSizePKR = accepted.length > 0 ? wonValuePKR / accepted.length : 0
    const averageDealSizeUSD = accepted.length > 0 ? wonValueUSD / accepted.length : 0
    
    return NextResponse.json({
      period: { year, month, startDate, endDate },
      summary: {
        totalProposals: proposals.length,
        totalSubmitted,
        accepted: accepted.length,
        rejected: rejected.length,
        inEvaluation: inEvaluation.length,
        draft: draft.length,
        totalValuePKR,
        totalValueUSD,
        wonValuePKR,
        wonValueUSD,
        winRate,
        averageDealSizePKR,
        averageDealSizeUSD
      },
      monthlyData,
      statusBreakdown,
      proposals: proposals.map(p => ({
        id: p.id,
        title: p.title,
        rfpNumber: p.rfpNumber,
        client: p.contact?.company || p.contact?.name || 'Unknown',
        sector: p.sector || p.contact?.sector,
        valuePKR: p.valuePKR,
        valueUSD: p.valueUSD,
        stage: p.stage,
        status: p.status,
        submissionDate: p.submissionDate,
        owner: p.owner?.name
      }))
    })
  } catch (error) {
    console.error('Error generating proposal report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
