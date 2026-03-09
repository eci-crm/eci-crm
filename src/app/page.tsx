'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { LoginScreen } from '@/components/crm/login-screen'
import { Dashboard } from '@/components/crm/dashboard'
import { ContactsPage } from '@/components/crm/contacts-page'
import { ProposalsPage } from '@/components/crm/proposals-page'
import { TasksPage } from '@/components/crm/tasks-page'
import { Sidebar } from '@/components/crm/sidebar'
import { Header } from '@/components/crm/header'

export type TabType = 'dashboard' | 'contacts' | 'proposals' | 'tasks'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/setup').catch(console.error)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex h-screen overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'contacts' && <ContactsPage />}
            {activeTab === 'proposals' && <ProposalsPage />}
            {activeTab === 'tasks' && <TasksPage />}
          </main>
        </div>
      </div>
    </div>
  )
}
