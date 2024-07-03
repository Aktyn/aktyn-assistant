import { useCallback, useEffect, useRef } from 'react'

export function useCancellablePromise() {
  const promises = useRef<{ promise: Promise<unknown>; cancel: () => void }[]>(
    [],
  )

  useEffect(
    () => () => {
      promises.current?.forEach((p) => p.cancel())
      promises.current = []
    },
    [],
  )

  return useCallback(<T extends Promise<unknown>>(promise: T): T => {
    let isCanceled = false

    const wrappedPromise = new Promise<unknown>((resolve, reject) => {
      promise
        .then((val) => (isCanceled ? reject() : resolve(val)))
        .catch((error) => (isCanceled ? reject() : reject(error)))
    }) as T

    promises.current?.push({
      promise: wrappedPromise,
      cancel() {
        isCanceled = true
      },
    })

    return wrappedPromise
  }, [])
}
