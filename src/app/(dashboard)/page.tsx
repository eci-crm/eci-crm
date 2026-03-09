'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckSquare, TrendingUp } from "lucide-react"

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspace Overview</h1>
        <p className="text-slate-500 italic">Welcome back! Here is your current pipeline status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">8 pending signature</p>
          </CardContent>
        </Card>
        
        {/* Additional cards can go here */}
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 h-[300px] flex items-center justify-center bg-white/50">
          <div className="text-center">
              <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-medium">Sales Chart coming soon...</p>
          </div>
      </div>
    </div>
  )
}
