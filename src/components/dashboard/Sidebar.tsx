'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Zap,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 border-r bg-white dark:bg-slate-900">
        {/* Logo Section */}
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              ECI CRM
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Optional) */}
        <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Plan</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Enterprise Edition</p>
          </div>
        </div>
      </div>
    </div>
  )
}
