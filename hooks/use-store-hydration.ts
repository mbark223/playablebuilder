import { useEffect } from 'react'
import { useProjectStore } from '@/store/project-store'

export function useStoreHydration() {
  useEffect(() => {
    useProjectStore.persist.rehydrate()
  }, [])
}