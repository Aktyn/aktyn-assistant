import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UserConfigType } from '@aktyn-assistant/core'
import { useMounted } from './useMounted'

export function useUserConfigValue<Key extends keyof UserConfigType>(
  key: Key,
): [
  UserConfigType[Key] | null,
  (value: UserConfigType[Key], onlyInternally?: boolean) => void,
  () => Promise<void>,
] {
  const mounted = useMounted()

  const [value, internalSetValue] = useState<UserConfigType[Key] | null>(null)

  const sync = useCallback(async () => {
    try {
      const value = await window.electronAPI.getUserConfigValue(key)
      if (mounted.current) {
        internalSetValue(value)
      }
    } catch (error) {
      console.error(error)
    }
  }, [key, mounted])

  const setValue = useCallback(
    (value: UserConfigType[Key], onlyInternally = false) => {
      internalSetValue(value)
      if (!onlyInternally) {
        window.electronAPI.setUserConfigValue(key, value)
      }
    },
    [key],
  )

  useEffect(() => {
    sync().catch(console.error)
  }, [sync])

  return useMemo(() => [value, setValue, sync], [value, setValue, sync])
}
