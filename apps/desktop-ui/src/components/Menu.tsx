import { Button } from '@/components/ui/button'
import { Cog, Info, MessageSquare, Wrench } from 'lucide-react'
import { useContext } from 'react'
import { GlobalContext } from '../context/GlobalContextProvider'
import { ViewType } from '../utils/navigation'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'
import icon from '@/assets/icon.png'

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
  const { initData, view, setView } = useContext(GlobalContext)

  return (
    <ScrollArea className="h-screen **:data-[slot=scroll-area-viewport]:*:h-full">
      <aside className="min-h-full border-r flex flex-col gap-y-3 items-stretch justify-start pt-4 bg-glass animate-in slide-in-from-left duration-view ease-out">
        <div className="flex flex-col items-center justify-center relative max-h-24 mb-3">
          <img
            src={icon}
            className="max-h-24 left-auto right-auto mx-auto blur-3xl absolute -z-1"
          />
          <img src={icon} className="h-full max-h-24" />
        </div>
        <nav className="flex flex-col items-stretch justify-start gap-y-3 px-3">
          {Object.values(ViewType).map((viewType) => {
            const IconComp = viewsProperties[viewType].icon
            return (
              <Button
                key={viewType}
                size="lg"
                variant="outline"
                disabled={view === viewType}
                onClick={() => setView(viewType)}
                className={cn(
                  'transition-colors duration-view',
                  view === viewType &&
                    'bg-primary/10! border-primary/50! text-primary opacity-100!',
                )}
              >
                <IconComp />
                <span>{viewsProperties[viewType].title}</span>
              </Button>
            )
          })}
        </nav>
        <Separator className="mt-auto" />
        <div className="pb-3 leading-none text-xs text-center text-secondary-foreground">
          v{initData?.version ?? '-'}
        </div>
      </aside>
    </ScrollArea>
  )
}
