'use client'

import { CRMLayout } from '@/components/crm-layout'
import { useCRMStore } from '@/lib/store'
import { LoginPage } from '@/components/login-page'

export default function Home() {
  const { isAuthenticated } = useCRMStore()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <CRMLayout />
}
