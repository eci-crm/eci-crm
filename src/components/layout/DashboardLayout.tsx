'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Building2, LogOut, Menu, X, LayoutDashboard, Users, FileText, 
  CheckSquare, BarChart3, FolderOpen, LucideIcon
} from 'lucide-react'

// Sidebar width constant - use this consistently
export const SIDEBAR_WIDTH = '288px' // w-72 in pixels
export const SIDEBAR_WIDTH_CLASS = 'w-72'

interface NavItem {
  id: string
  icon: LucideIcon
  label: string
}

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    name: string
    email: string
  }
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  navItems?: NavItem[]
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'clients', icon: Users, label: 'Clients' },
  { id: 'proposals', icon: FileText, label: 'Proposals' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'resources', icon: FolderOpen, label: 'Resources' },
]

export function DashboardLayout({
  children,
  user,
  activeTab,
  onTabChange,
  onLogout,
  navItems = defaultNavItems
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect screen size and set mobile state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Close sidebar when switching to desktop
      if (!mobile) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen])

  const handleTabChange = useCallback((tab: string) => {
    onTabChange(tab)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [onTabChange, isMobile])

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="dashboard-root min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Header - Only visible on screens < 1024px */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openSidebar} 
            className="p-2 h-10 w-10"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ECI CRM
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xs">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar Backdrop - Only on mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 ${SIDEBAR_WIDTH_CLASS}
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
          text-white transition-transform duration-300 ease-in-out
          flex flex-col z-50 shadow-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                ECI CRM
              </span>
              <p className="text-[10px] text-slate-400">Enterprise Intelligence</p>
            </div>
          </div>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={closeSidebar} 
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 h-9 w-9"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                  transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-white border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`
                  p-2 rounded-lg transition-all shrink-0
                  ${isActive 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30' 
                    : 'bg-slate-700/50'
                  }
                `}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onLogout} 
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content min-h-screen lg:pl-72 pt-16 lg:pt-0">
        <div className="content-wrapper p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
