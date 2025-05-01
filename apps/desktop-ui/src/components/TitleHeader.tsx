import { GlobalContext } from '@/context/GlobalContextProvider'
import { cn } from '@/lib/utils'
import { ViewType } from '@/utils/navigation'
import { useContext } from 'react'

const words = 'Aktyn Assistant'.split(/\s/)

export const TitleHeader = () => {
  const { ready, view } = useContext(GlobalContext)

  const visible = view !== ViewType.Chat

  if (!ready) {
    return null
  }

  return (
    <header
      id="content-header"
      data-color="#55ff55"
      className={cn(
        'absolute top-0 left-0 w-full pt-8 ai-font flex flex-wrap justify-center text-center font-thin text-8xl min-w-min mx-auto gap-x-16 pointer-events-none duration-view ease-out fill-mode-both',
        visible
          ? 'animate-in fade-in slide-in-from-top-120 delay-200'
          : 'animate-out fade-out slide-out-to-top-120',
      )}
    >
      {words.map((word, index) => (
        <span
          key={index}
          className="relative pointer-events-none"
          style={{
            background: `linear-gradient(160deg, var(--gradient-secondary), var(--gradient-primary), var(--gradient-secondary)) text`,
            color: '#fff8',
          }}
        >
          <span className="absolute left-0 top-0 blur-md p-16 -m-16 text-background">
            {word}
          </span>
          {word}
        </span>
      ))}
    </header>
  )
}
