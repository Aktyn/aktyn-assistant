import { useContext, useEffect, useRef, useState } from 'react'
import { GlobalContext } from '../context/GlobalContextProvider'
import { palette } from '../utils/palette'

const words = 'Aktyn Assistant'.split(/\s/)

export const TitleHeader = () => {
  const ref = useRef<HTMLHeadingElement>(null)
  const { ready } = useContext(GlobalContext)

  const [, setIsReady] = useState(false)

  // const visible = view !== ViewType.Chat
  // const isAnyViewEntered = !!view

  //TODO: Add animation
  // useEffect(() => {
  //   const header = ref.current
  //   if (!header || !isReady) {
  //     return
  //   }

  //   const height = header.getBoundingClientRect().height
  //   const animation = anime({
  //     targets: header.childNodes,
  //     easing: 'spring(1, 80, 10, 0)',
  //     delay: anime.stagger(100, { from: visible ? 'last' : 'first' }),
  //     translateY: visible
  //       ? isAnyViewEntered
  //         ? 0
  //         : (window.innerHeight - height) / 2
  //       : -height,
  //     opacity: visible ? 1 : 0,
  //   })

  //   return () => {
  //     anime.remove(animation)
  //   }
  // }, [isAnyViewEntered, isReady, visible])

  useEffect(() => {
    if (!ready) {
      return
    }

    const timeout = setTimeout(() => {
      setIsReady(true)
    }, 200)

    return () => {
      clearTimeout(timeout)
    }
  }, [ready])

  return (
    <div className="absolute top-0 left-0 w-full h-full pt-8">
      <header
        ref={ref}
        id="content-header"
        className="ai-font flex flex-wrap justify-center text-center font-thin text-8xl min-w-min mx-auto gap-x-16 pointer-events-none"
      >
        {words.map((word, index) => (
          <span
            key={index}
            className="relative pointer-events-none"
            style={{
              background: `linear-gradient(160deg, ${palette.gradientColorPrimary}, ${palette.gradientColorSecondary}) text`,
              color: '#fff8',

              transform: 'translateY(-192px)',
              opacity: 0,
            }}
          >
            <span className="absolute left-0 top-0 blur-md p-16 -m-16 text-cyan-300">
              {word}
            </span>
            {word}
          </span>
        ))}
      </header>
    </div>
  )
}
