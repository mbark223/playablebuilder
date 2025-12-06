'use client'

import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/project-store'

export function useStoreHydration() {
  const [hasHydrated, setHasHydrated] = useState(() => {
    return typeof window === 'undefined'
      ? false
      : useProjectStore.persist.hasHydrated?.() ?? false
  })

  useEffect(() => {
    const unsubscribe = useProjectStore.persist.onFinishHydration?.(() => {
      setHasHydrated(true)
    })

    if (useProjectStore.persist.hasHydrated?.()) {
      setHasHydrated(true)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  return hasHydrated
}
