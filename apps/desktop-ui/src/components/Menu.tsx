import { mdiChat, mdiCog, mdiInformationBox } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'

import { useContext } from 'react'
import { GlobalContext } from '../context/GlobalContextProvider'
import icon from '../img/icon.png'

enum ViewType {
  Chat = 'chat',
  Settings = 'settings',
  Info = 'info',
}

const viewsProperties: {
  [key in ViewType]: { title: string; icon: string }
} = {
  [ViewType.Chat]: {
    title: 'Chat',
    icon: mdiChat,
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
  const { initData } = useContext(GlobalContext)

  return (
    <aside className="h-full bg-background bg-opacity-10 border-r border-divider backdrop-blur-[6px] flex flex-col items-stretch justify-start pt-4">
      <div className="flex flex-col items-center justify-center relative max-h-24 mb-6">
        <img
          src={icon}
          className="max-h-24 left-auto right-auto mx-auto blur-[64px] absolute z-[-1]"
        />
        <img src={icon} className="h-full max-h-24" />
      </div>
      <div className="flex flex-col items-stretch justify-start gap-y-2 px-4">
        {Object.values(ViewType).map((viewType) => (
          <Button
            key={viewType}
            className="border-foreground-600 border-opacity-50 border-1 text-foreground-50 hover:border-primary-100 hover:text-primary-100 hover:bg-primary-400 hover:bg-opacity-25 font-semibold justify-start"
            size="lg"
            fullWidth
            variant="bordered"
            radius="sm"
          >
            <Icon path={viewsProperties[viewType].icon} size="2rem" />
            <span>{viewsProperties[viewType].title}</span>
          </Button>
        ))}
      </div>
      <span className="flex-grow" />
      <hr />
      <div className="py-1 text-foreground-600 text-xs text-center">
        {initData?.version ?? '-'}
      </div>
    </aside>
  )
}
