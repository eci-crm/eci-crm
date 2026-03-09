'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreHorizontal, Calendar, Loader2, FileText } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string | null
  status: string
  totalAmount: number
  currency: string
  validUntil: string | null
  createdAt: string
  contact: { id: string; name: string; company: string | null }
  owner: { id: string; name: string; email: string }
  budgets: Array<{ id: string; name: string; amount: number }>
}

export function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/proposals')
      .then(res => res.json())
      .then(data => {
        setProposals(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredProposals = proposals.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.contact?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Proposals</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
              </div>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading proposals...
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No proposals found. Click "New Proposal" to create one.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProposals.map(proposal => (
                <div key={proposal.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{proposal.title}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{proposal.contact?.name || 'Unknown'}</span>
                      {proposal.contact?.company && <span>• {proposal.contact.company}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      ${proposal.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">{proposal.budgets?.length || 0} budget items</div>
                  </div>
                  <Badge className={statusColors[proposal.status] || statusColors.DRAFT}>{proposal.status}</Badge>
                  <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
