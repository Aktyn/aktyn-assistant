import { useContext } from 'react'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { GlobalContext } from '../context/GlobalContextProvider'
import { ViewType } from '../utils/navigation'
import { Info } from '../views/Info'

const views = Object.values(ViewType)

export const Content = () => {
  const { view } = useContext(GlobalContext)
  const viewIndex = view ? views.indexOf(view) : -1

  return (
    <div
      className={`transition-[flex-grow] w-full ease-in-out duration-500 relative overflow-hidden`}
      style={{
        flexGrow: view ? 1 : 0,
      }}
    >
      {views.map((viewType) => {
        const indexDiff = views.indexOf(viewType) - viewIndex
        const diff = Math.max(-1, Math.min(1, indexDiff)) * 50

        return (
          <ScrollShadow
            key={viewType}
            className="absolute left-0 top-0 w-full h-full flex flex-col justify-start items-center transition-[opacity,transform] duration-400 ease-in-out overflow-x-hidden"
            style={{
              opacity: view === viewType ? 1 : 0,
              transform: `translateX(${diff}%) scale(${diff === 0 ? 1 : 0.618})`,
            }}
          >
            {viewType === ViewType.Chat && <span>TODO - chat</span>}
            {viewType === ViewType.Settings && <span>TODO - setting</span>}
            {viewType === ViewType.Info && <Info in={view === viewType} />}
          </ScrollShadow>
        )
      })}
    </div>
  )
}
