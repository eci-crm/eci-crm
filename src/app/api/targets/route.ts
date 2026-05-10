import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 })
    }

    const yearNum = parseInt(year)

    // Fetch all targets for this year (both overall and service-specific)
    const targets = await db.businessTarget.findMany({
      where: { year: yearNum },
      include: { service: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    // Calculate annual target (from records with no serviceId and no month)
    const annualTargetRecord = targets.find((t) => !t.serviceId && t.month === null)
    const annualTarget = annualTargetRecord?.amount || 0

    // Monthly overrides (records with no serviceId but with month)
    const monthlyOverrides = targets
      .filter((t) => !t.serviceId && t.month !== null)
      .map((t) => ({ month: t.month!, amount: t.amount }))

    // Service-specific targets
    const serviceTargetMap = new Map<string, {
      serviceId: string
      serviceName: string
      annualTarget: number
      monthlyOverrides: { month: number; amount: number }[]
    }>()

    for (const t of targets) {
      if (!t.serviceId) continue

      const existing = serviceTargetMap.get(t.serviceId)
      if (!existing) {
        serviceTargetMap.set(t.serviceId, {
          serviceId: t.serviceId,
          serviceName: t.service?.name || 'Unknown',
          annualTarget: t.month === null ? t.amount : 0,
          monthlyOverrides: t.month !== null ? [{ month: t.month, amount: t.amount }] : [],
        })
      } else {
        if (t.month === null) {
          existing.annualTarget = t.amount
        } else {
          existing.monthlyOverrides.push({ month: t.month, amount: t.amount })
        }
      }
    }

    const serviceTargets = Array.from(serviceTargetMap.values()).map((st) => ({
      ...st,
      showMonthly: st.monthlyOverrides.length > 0,
    }))

    return NextResponse.json({
      year: yearNum,
      annualTarget,
      monthlyOverrides,
      serviceTargets,
    })
  } catch (error) {
    console.error('Error fetching targets:', error)
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targets } = body as {
      targets: Array<{
        year: number
        annualTarget: number
        monthlyOverrides: Array<{ month: number; amount: number }>
        serviceTargets: Array<{
          serviceId: string
          annualTarget: number
          monthlyOverrides: Array<{ month: number; amount: number }>
        }>
      }>
    }

    if (!targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: 'Targets array is required' }, { status: 400 })
    }

    // Deduplicate years to prevent data loss from duplicate entries
    const uniqueYears = [...new Set(targets.map((t) => t.year))]

    // Wrap deleteMany + create in a transaction to prevent data loss
    const results = await db.$transaction(async (tx) => {
      // Delete existing targets for all unique years at once
      await tx.businessTarget.deleteMany({
        where: { year: { in: uniqueYears } },
      })

      const created: unknown[] = []

      for (const target of targets) {
        const { year, annualTarget, monthlyOverrides, serviceTargets } = target

        // Create annual target (no serviceId, no month)
        if (annualTarget > 0) {
          const annualRecord = await tx.businessTarget.create({
            data: {
              year,
              month: null,
              amount: annualTarget,
              serviceId: null,
            },
          })
          created.push(annualRecord)
        }

        // Create monthly overrides (no serviceId, with month)
        for (const mo of monthlyOverrides) {
          if (mo.amount > 0) {
            const monthlyRecord = await tx.businessTarget.create({
              data: {
                year,
                month: mo.month,
                amount: mo.amount,
                serviceId: null,
              },
            })
            created.push(monthlyRecord)
          }
        }

        // Create service-specific targets
        for (const st of serviceTargets) {
          // Service annual target (with serviceId, no month)
          if (st.annualTarget > 0) {
            const serviceAnnualRecord = await tx.businessTarget.create({
              data: {
                year,
                month: null,
                amount: st.annualTarget,
                serviceId: st.serviceId,
              },
            })
            created.push(serviceAnnualRecord)
          }

          // Service monthly overrides
          for (const mo of st.monthlyOverrides) {
            if (mo.amount > 0) {
              const serviceMonthlyRecord = await tx.businessTarget.create({
                data: {
                  year,
                  month: mo.month,
                  amount: mo.amount,
                  serviceId: st.serviceId,
                },
              })
              created.push(serviceMonthlyRecord)
            }
          }
        }
      }

      return created
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error creating targets:', error)
    return NextResponse.json({ error: 'Failed to create targets' }, { status: 500 })
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
    const { year, month, amount, serviceId } = body

    const data: Record<string, unknown> = {}
    if (year !== undefined) data.year = year
    if (month !== undefined) data.month = month
    if (amount !== undefined) data.amount = amount
    if (serviceId !== undefined) data.serviceId = serviceId

    const target = await db.businessTarget.update({
      where: { id },
      data,
      include: { service: true },
    })

    return NextResponse.json(target)
  } catch (error) {
    console.error('Error updating target:', error)
    return NextResponse.json({ error: 'Failed to update target' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.businessTarget.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting target:', error)
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 })
  }
}
