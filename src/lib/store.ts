'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeName = 'original' | 'eci'

interface CRMStore {
  isAuthenticated: boolean
  user: Record<string, unknown> | null
  currentPage: string
  sidebarOpen: boolean
  theme: ThemeName
  login: (user: Record<string, unknown>) => void
  logout: () => void
  setCurrentPage: (page: string) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: ThemeName) => void
}

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      currentPage: 'dashboard',
      sidebarOpen: true,
      theme: 'original',
      login: (user: Record<string, unknown>) =>
        set({ isAuthenticated: true, user }),
      logout: () =>
        set({ isAuthenticated: false, user: null, currentPage: 'dashboard' }),
      setCurrentPage: (page: string) => set({ currentPage: page }),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setTheme: (theme: ThemeName) => set({ theme }),
    }),
    {
      name: 'crm-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        currentPage: state.currentPage,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
)
