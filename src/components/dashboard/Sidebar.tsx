'use client'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, CheckSquare, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: FileText, label: 'Proposals', href: '/proposals' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white dark:bg-slate-900 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary">ECI CRM</h2>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              pathname === item.href 
                ? "bg-primary text-primary-foreground" 
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
