'use client'

import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, CheckSquare, LogOut, ChevronLeft, ChevronRight, Building2, Calendar, BarChart3, Settings } from 'lucide-react'

type TabType = 'dashboard' | 'contacts' | 'proposals' | 'tasks' | 'calendar' | 'reports' | 'settings'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const menuItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contacts' as TabType, label: 'Contacts', icon: Users },
  { id: 'proposals' as TabType, label: 'Proposals', icon: FileText },
  { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
  { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
  { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { logout, user } = useAuthStore()

  return (
    <aside className={cn(
      'fixed md:relative z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
      isOpen ? 'w-64' : 'w-0 md:w-16 overflow-hidden md:overflow-visible'
    )}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-sm">ECI CRM</h1>
              <p className="text-xs text-slate-500">by Irfan Munir</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 mt-4">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 h-10',
              activeTab === item.id
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </aside>
  )
}
