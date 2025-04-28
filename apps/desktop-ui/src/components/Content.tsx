import { useContext, useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlobalContext } from '../context/GlobalContextProvider'
import { ViewType } from '../utils/navigation'
import { Chat } from '../views/Chat'
import { Info } from '../views/Info'
import { Settings } from '../views/Settings'
import { Tools } from '../views/Tools'

const views = Object.values(ViewType)

export const Content = () => {
  const { view } = useContext(GlobalContext)
  const viewIndex = view ? views.indexOf(view) : -1

  const [ready, setReady] = useState(false)
  const [contentHeaderHeight, setContentHeaderHeight] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      const contentHeader = document.getElementById('content-header')
      if (!contentHeader) {
        return
      }
      const updateSize = () =>
        setContentHeaderHeight(contentHeader.getBoundingClientRect().height)

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
  }, [])

  const isAnyViewEntered = !!view
  useEffect(() => {
    if (ready || !isAnyViewEntered) {
      return
    }

    const timeout = setTimeout(() => {
      setReady(true)
    }, 700) //700

    return () => {
      clearTimeout(timeout)
    }
  }, [isAnyViewEntered, ready])

  return (
    <div
      className={`transition-[flex-grow] w-full ease-in-out duration-700 relative overflow-hidden`}
      style={{
        flexGrow: view ? 1 : 0,
      }}
    >
      {view
        ? views.map((viewType) => {
            const indexDiff = views.indexOf(viewType) - viewIndex
            const diff = ready ? Math.max(-1, Math.min(1, indexDiff)) * 50 : 1

            const active = ready && view === viewType

            return (
              <ScrollArea
                key={viewType}
                className="absolute left-0 top-0 w-full h-full flex flex-col justify-start items-start transition-[opacity,transform] duration-400 ease-in-out px-4 *:mx-auto"
                style={{
                  pointerEvents: active ? 'all' : 'none',
                  opacity: active ? 1 : 0,
                  transform:
                    viewType === ViewType.Chat
                      ? `translate(${diff}%, ${Math.abs(diff)}%) scale(${diff === 0 ? 1 : 0.618})`
                      : `translateX(${diff}%) scale(${diff === 0 ? 1 : 0.618})`,
                  paddingTop:
                    viewType === ViewType.Chat ? '2rem' : contentHeaderHeight,
                }}
              >
                {viewType === ViewType.Chat && <Chat in={active} />}
                {viewType === ViewType.Tools && <Tools in={active} />}
                {viewType === ViewType.Settings && <Settings in={active} />}
                {viewType === ViewType.Info && <Info in={active} />}
              </ScrollArea>
            )
          })
        : null}
    </div>
  )
}
