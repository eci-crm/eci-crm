'use client'

import { useSyncExternalStore } from 'react'

// Returns false during SSR and initial hydration, true after mount
// This avoids hydration mismatches when reading from localStorage (Zustand persist)
const emptySubscribe = () => () => {}

export function useHydration() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
