'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChart3,
  FolderOpen,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  KeyRound,
  User,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCRMStore } from '@/lib/store'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { ErrorBoundary } from '@/components/error-boundary'
import { CRMNotifications } from '@/components/crm/notifications'
import { CRMChatbot } from '@/components/crm/chatbot'
import CRMClients from '@/components/crm/clients'
import CRMCalendar from '@/components/crm/calendar'
import CRMDashboard from '@/components/crm/dashboard'
import CRMProposals from '@/components/crm/proposals'
import CRMReports from '@/components/crm/reports'
import CRMSettings from '@/components/crm/settings'
import CRMResources from '@/components/crm/resources'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'proposals', label: 'Proposals', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]



export function CRMLayout() {
  const { user, currentPage, sidebarOpen, theme, setCurrentPage, setSidebarOpen, logout } =
    useCRMStore()
  const isMobile = useIsMobile()
  const [companyName, setCompanyName] = useState('ECI CRM')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Theme-dependent classes
  const isECITheme = theme === 'eci'
  const sidebarBg = isECITheme ? 'bg-navy' : 'bg-slate-900'
  const sidebarBorder = 'border-white/10'
  const brandColor = isECITheme ? 'brand' : 'emerald'
  const activeBg = isECITheme
    ? 'bg-brand/15 text-brand'
    : 'bg-emerald-500/15 text-emerald-400'
  const activeIcon = isECITheme
    ? 'text-brand'
    : 'text-emerald-400'
  const activeDot = isECITheme
    ? 'bg-brand'
    : 'bg-emerald-400'
  const inactiveText = 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
  const inactiveIcon = 'text-slate-500 group-hover:text-slate-300'
  const logoGradient = isECITheme
    ? 'from-brand to-brand-dark'
    : 'from-emerald-500 to-teal-600'
  const logoShadow = isECITheme
    ? 'shadow-brand/20'
    : 'shadow-emerald-500/20'
  const helpBtnColor = isECITheme
    ? 'text-brand hover:text-brand/80 hover:bg-white/5'
    : 'text-emerald-400 hover:text-emerald-300 hover:bg-white/5'
  const mainBg = isECITheme ? 'bg-[#F5F5F5]' : 'bg-slate-50'
  const headerBg = 'bg-white'
  const avatarBg = isECITheme
    ? 'bg-brand-light text-brand-dark'
    : 'bg-emerald-100 text-emerald-700'

  useEffect(() => {
    async function loadInitialData() {
      try {
        // Check if database needs seeding (safety net for first deployment)
        const seedCheck = await fetch('/api/seed')
        if (seedCheck.ok) {
          const seedData = await seedCheck.json()
          if (!seedData.initialized) {
            // Database is empty, trigger auto-seed
            await fetch('/api/seed', { method: 'POST' })
          }
        }

        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok) {
          const data: Array<{ key: string; value: string }> = await settingsRes.json()
          const nameSetting = data.find((s) => s.key === 'companyName')
          const logoSetting = data.find((s) => s.key === 'companyLogo')
          if (nameSetting) setCompanyName(nameSetting.value)
          if (logoSetting && logoSetting.value) setCompanyLogo(logoSetting.value)
        }
      } catch {
        // keep defaults
      }
    }
    loadInitialData()

    // Listen for settings updates from the Settings page
    const handleSettingsUpdate = () => loadInitialData()
    window.addEventListener('settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate)
  }, [])

  const currentNavItem = navItems.find((item) => item.id === currentPage)
  const pageTitle = currentNavItem?.label || 'Dashboard'

  const userInitials = user?.name
    ? (user.name as string)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleNavClick = (id: string) => {
    setCurrentPage(id)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col">
      {/* Logo area */}
      <div className={`flex h-16 items-center gap-3 border-b ${sidebarBorder} px-4`}>
        {companyLogo ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-md overflow-hidden">
            <img
              src={companyLogo}
              alt="Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
        ) : (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${logoGradient} shadow-md ${logoShadow}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        )}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <h1 className="truncate text-base font-bold text-white" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
              {companyName}
            </h1>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon

          const navButton = (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? activeBg + ' shadow-sm'
                  : inactiveText
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? activeIcon : inactiveIcon
                }`}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className={`ml-auto h-1.5 w-1.5 rounded-full ${activeDot}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return navButton
        })}
      </nav>

      {/* Sidebar footer */}
      {!collapsed && (
        <div className={`border-t ${sidebarBorder} p-4`}>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-medium text-slate-300">Need help?</p>
            <p className="mt-1 text-xs text-slate-500">
              Check our docs or contact support
            </p>
            <Button
              variant="ghost"
              size="sm"
              className={`mt-2 h-7 w-full text-xs ${helpBtnColor}`}
              onClick={() => toast.info('Documentation will be available soon.')}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              View Documentation
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 72 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className={`relative z-30 flex shrink-0 flex-col border-r ${sidebarBorder} ${sidebarBg}`}
        >
          {renderSidebarContent(!sidebarOpen)}

          {/* Collapse button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50"
          >
            <motion.div
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
            </motion.div>
          </button>
        </motion.aside>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className={`w-[280px] ${sidebarBg} p-0 ${sidebarBorder}`}>
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            {renderSidebarContent(false)}
          </SheetContent>
        </Sheet>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className={`flex h-16 shrink-0 items-center justify-between border-b ${headerBg} px-4 sm:px-6`}>
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            )}
            <div>
              <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell - using CRMNotifications component */}
            <CRMNotifications />

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-sm font-semibold ${avatarBg}`}>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {(user?.name as string) || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(user?.role as string) || 'Member'}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{(user?.name as string) || 'User'}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {(user?.email as string) || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => toast.info('Profile settings coming soon')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Change password coming soon')}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {currentPage === 'dashboard' ? (
                <ErrorBoundary><CRMDashboard /></ErrorBoundary>
              ) : currentPage === 'clients' ? (
                <ErrorBoundary><CRMClients /></ErrorBoundary>
              ) : currentPage === 'proposals' ? (
                <ErrorBoundary><CRMProposals /></ErrorBoundary>
              ) : currentPage === 'calendar' ? (
                <ErrorBoundary><CRMCalendar /></ErrorBoundary>
              ) : currentPage === 'reports' ? (
                <ErrorBoundary><CRMReports /></ErrorBoundary>
              ) : currentPage === 'resources' ? (
                <ErrorBoundary><CRMResources /></ErrorBoundary>
              ) : currentPage === 'settings' ? (
                <ErrorBoundary><CRMSettings /></ErrorBoundary>
              ) : (
                <ErrorBoundary><CRMDashboard /></ErrorBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Chatbot */}
      <CRMChatbot />
    </div>
  )
}
