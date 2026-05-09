'use client'

import { useCRMStore } from '@/lib/store'
import { LoginPage } from '@/components/login-page'
import { CRMLayout } from '@/components/crm-layout'
import { useHydration } from '@/hooks/use-hydration'

export default function Home() {
  const { isAuthenticated } = useCRMStore()
  const hydrated = useHydration()

  // During SSR and initial hydration, always show login to avoid mismatch
  // After hydration, use the real auth state from localStorage
  if (!hydrated || !isAuthenticated) {
    return <LoginPage />
  }

  return <CRMLayout />
}
