import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

type AutoSizerProps = {
  children: (size: { width: number; height: number }) => ReactNode
  delay?: number
}

export const AutoSizer = ({ children, delay = 16 }: AutoSizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const updateSize = useDebounce(
    () => {
      const boundingBox = containerRef.current?.getBoundingClientRect?.()

      setSize({
        width: boundingBox?.width ?? 0,
        height: boundingBox?.height ?? 0,
      })
    },
    delay,
    [],
  )

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    if ('ResizeObserver' in window) {
      try {
        const tabsObserver = new ResizeObserver(updateSize)
        tabsObserver.observe(containerRef.current)

        return () => {
          tabsObserver.disconnect()
        }
      } catch (e) {
        console.error(e)
      }
    } else {
      updateSize()
    }
  }, [updateSize])

  return <div ref={containerRef}>{children(size)}</div>
}
