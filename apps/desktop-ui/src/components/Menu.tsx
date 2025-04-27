import { useContext, useEffect, useRef } from 'react'
import { mdiChat, mdiCog, mdiHammerWrench, mdiInformationBox } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'

import { Divider } from '@nextui-org/divider'
import anime from 'animejs'
import { GlobalContext } from '../context/GlobalContextProvider'
import icon from '../img/icon.png'
import { ViewType } from '../utils/navigation'

const viewsProperties: {
  [key in ViewType]: { title: string; icon: string }
} = {
  [ViewType.Chat]: {
    title: 'Chat',
    icon: mdiChat,
  },
  [ViewType.Tools]: {
    title: 'Tools',
    icon: mdiHammerWrench,
  },
  [ViewType.Settings]: {
    title: 'Settings',
    icon: mdiCog,
  },
  [ViewType.Info]: {
    title: 'Info',
    icon: mdiInformationBox,
  },
}

export const Menu = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { ready, initData, view, setView } = useContext(GlobalContext)

  useEffect(() => {
    if (!ready) {
      return
    }

    const animation = anime({
      targets: ref.current,
      easing: 'easeOutSine',
      duration: 400,
      delay: 200,
      translateX: '0%',
    })

    return () => {
      anime.remove(animation)
    }
  }, [ready])

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
        {Object.values(ViewType).map((viewType) => (
          <Button
            key={viewType}
            className="font-semibold justify-start border-foreground-600 border-opacity-50 border-1 text-foreground-50 [&:not(:disabled)]:hover:border-primary-100 disabled:border-primary-200 [&:not(:disabled)]:hover:text-primary-100 [&:not(:disabled)]:hover:bg-primary-400 [&:not(:disabled)]:hover:bg-opacity-25 disabled:text-primary-400 disabled:opacity-100 [&:not(:disabled)]:rounded-lg disabled:rounded-none disabled:border-x-transparent mx-4 disabled:mx-0 [&:not(:disabled)]:px-6 disabled:px-10 !transition-all duration-1000 ease-in-out"
            size="lg"
            variant="bordered"
            disableAnimation={false}
            isDisabled={view === viewType}
            onClick={() => setView(viewType)}
          >
            <Icon path={viewsProperties[viewType].icon} size="2rem" />
            <span>{viewsProperties[viewType].title}</span>
          </Button>
        ))}
      </div>
      <span className="flex-grow" />
      <Divider />
      <div className="py-1 text-foreground-600 text-xs text-center">
        v{initData?.version ?? '-'}
      </div>
    </aside>
  )
}
