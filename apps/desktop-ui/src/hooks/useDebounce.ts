import { useCallback, useRef } from 'react'
import { useMounted } from './useMounted'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay = 0,
) {
  const timeout = useRef<NodeJS.Timeout | null>(null)
  const mounted = useMounted()

  return useCallback(
    (...args: Parameters<typeof func>) => {
      if (!delay && mounted.current) {
        return func(...args)
      }

      if (timeout.current) {
        window.clearTimeout(timeout.current)
      }
      timeout.current = setTimeout(() => {
        if (mounted.current) {
          func(...args)
        }
      }, delay)
    },
    [delay, func, mounted],
  )
}
