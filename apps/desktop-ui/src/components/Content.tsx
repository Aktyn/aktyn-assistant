import { useContext, useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlobalContext } from '@/context/GlobalContextProvider'
import { ViewType } from '@/utils/navigation'
import { Chat } from '@/components/views/Chat'
import { Info } from '@/components/views/Info'
import { Settings } from '@/components/views/Settings'
import { Tools } from '@/components/views/Tools'
import { cn } from '@/lib/utils'

const views = Object.values(ViewType)

export const Content = () => {
  const { view } = useContext(GlobalContext)
  const viewIndex = view ? views.indexOf(view) : -1

  const [ready, setReady] = useState(false)
  const [contentHeaderHeight, setContentHeaderHeight] = useState(0)

  useEffect(() => {
    if (!ready) {
      return
    }

    const timeout = setTimeout(() => {
      const contentHeader = document.getElementById('content-header')
      if (!contentHeader) {
        return
      }
      const updateSize = () =>
        setContentHeaderHeight(
          (prev) => contentHeader.getBoundingClientRect().height ?? prev,
        )

      if ('ResizeObserver' in window) {
        try {
          const tabsObserver = new ResizeObserver(updateSize)
          tabsObserver.observe(contentHeader)

          return () => {
            tabsObserver.disconnect()
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        updateSize()
      }
    }, 16)

    return () => {
      clearTimeout(timeout)
    }
  }, [ready])

  const isAnyViewEntered = !!view
  useEffect(() => {
    if (ready || !isAnyViewEntered) {
      return
    }

    const timeout = setTimeout(() => {
      setReady(true)
    }, 700)

    return () => {
      clearTimeout(timeout)
    }
  }, [isAnyViewEntered, ready])

  if (!view) {
    return null
  }

  return (
    <div
      className="transition-[flex-grow] w-full h-screen ease-in-out duration-view relative overflow-hidden"
      style={{
        flexGrow: view ? 1 : 0,
        //@ts-expect-error custom css variable
        ['--header-height']: `${contentHeaderHeight}px`,
      }}
    >
      {views.map((viewType) => {
        const indexDiff = views.indexOf(viewType) - viewIndex
        const diff = ready ? Math.max(-1, Math.min(1, indexDiff)) * 50 : 1

        const active = ready && view === viewType

        return (
          <ScrollArea
            key={viewType}
            className={cn(
              'absolute! inset-0 w-full flex flex-col justify-start items-start transition-[opacity,transform] duration-view fill-mode-both ease-in-out px-4 *:mx-auto',
              viewType !== ViewType.Chat && '*:pt-[var(--header-height)]',
              active
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none',
            )}
            style={{
              transform: `translateX(${diff}%) scale(${diff === 0 ? 1 : 0.618})`,
              // viewType === ViewType.Chat
              //   ? `translate(${diff}%, ${Math.abs(diff)}%) scale(${diff === 0 ? 1 : 0.618})`
              //   : `translateX(${diff}%) scale(${diff === 0 ? 1 : 0.618})`,
            }}
          >
            {viewType === ViewType.Chat && <Chat in={active} />}
            {viewType === ViewType.Tools && <Tools in={active} />}
            {viewType === ViewType.Settings && <Settings in={active} />}
            {viewType === ViewType.Info && <Info in={active} />}
          </ScrollArea>
        )
      })}
    </div>
  )
}
