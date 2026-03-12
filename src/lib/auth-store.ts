import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  department?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'eci-crm-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Hook to check hydration
export const useHydration = () => {
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  return hasHydrated
}
