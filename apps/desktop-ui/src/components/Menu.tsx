import { Button } from '@/components/ui/button'
import { Cog, Info, MessageSquare, Wrench } from 'lucide-react'
import { useContext, useRef } from 'react'
import { GlobalContext } from '../context/GlobalContextProvider'
import icon from '../img/icon.png'
import { ViewType } from '../utils/navigation'

const viewsProperties: {
  [key in ViewType]: { title: string; icon: React.ElementType }
} = {
  [ViewType.Chat]: {
    title: 'Chat',
    icon: MessageSquare,
  },
  [ViewType.Tools]: {
    title: 'Tools',
    icon: Wrench,
  },
  [ViewType.Settings]: {
    title: 'Settings',
    icon: Cog,
  },
  [ViewType.Info]: {
    title: 'Info',
    icon: Info,
  },
}

export const Menu = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { initData, view, setView } = useContext(GlobalContext)

  //TODO: Add animation
  // useEffect(() => {
  //   if (!ready) {
  //     return
  //   }

  //   const animation = anime({
  //     targets: ref.current,
  //     easing: 'easeOutSine',
  //     duration: 400,
  //     delay: 200,
  //     translateX: '0%',
  //   })

  //   return () => {
  //     anime.remove(animation)
  //   }
  // }, [ready])

  return (
    <aside
      ref={ref}
      className="h-full bg-background bg-opacity-10 border-r border-divider backdrop-blur-[6px] flex flex-col items-stretch justify-start pt-4"
      style={{ transform: 'translateX(-100%)' }}
    >
      <div className="flex flex-col items-center justify-center relative max-h-24 mb-6">
        <img
          src={icon}
          className="max-h-24 left-auto right-auto mx-auto blur-[64px] absolute z-[-1]"
        />
        <img src={icon} className="h-full max-h-24" />
      </div>
      <div className="flex flex-col items-stretch justify-start gap-y-2">
        {Object.values(ViewType).map((viewType) => {
          const IconComp = viewsProperties[viewType].icon
          return (
            <Button
              key={viewType}
              className="font-semibold justify-start border-foreground-600 border-opacity-50 border-1 text-foreground-50 [&:not(:disabled)]:hover:border-primary-100 disabled:border-primary-200 [&:not(:disabled)]:hover:text-primary-100 [&:not(:disabled)]:hover:bg-primary-400 [&:not(:disabled)]:hover:bg-opacity-25 disabled:text-primary-400 disabled:opacity-100 [&:not(:disabled)]:rounded-lg disabled:rounded-none disabled:border-x-transparent mx-4 disabled:mx-0 [&:not(:disabled)]:px-6 disabled:px-10 !transition-all duration-1000 ease-in-out"
              size="lg"
              variant="outline"
              disabled={view === viewType}
              onClick={() => setView(viewType)}
            >
              <IconComp size={32} className="mr-2" />
              <span>{viewsProperties[viewType].title}</span>
            </Button>
          )
        })}
      </div>
      <span className="flex-grow" />
      <div className="border-t border-divider my-2 w-full" />
      <div className="py-1 text-foreground-600 text-xs text-center">
        v{initData?.version ?? '-'}
      </div>
    </aside>
  )
}
