import { useContext, useEffect, useRef } from 'react'
import anime from 'animejs'
import { GlobalContext } from '../context/GlobalContextProvider'
import { ViewType } from '../utils/navigation'
import { palette } from '../utils/palette'

const words = 'Aktyn Assistant'.split(/\s/)

export const TitleHeader = () => {
  const ref = useRef<HTMLHeadingElement>(null)
  const { view } = useContext(GlobalContext)

  const visible = view !== ViewType.Chat

  useEffect(() => {
    const header = ref.current
    if (!header) {
      return
    }

    const height = header.getBoundingClientRect().height
    const animation = anime({
      targets: header.childNodes,
      easing: 'spring(1, 80, 10, 0)',
      delay: anime.stagger(100, { from: visible ? 'last' : 'first' }),
      translateY: visible ? 0 : -height,
      opacity: visible ? 1 : 0,
    })
    const marginAnimation = anime({
      targets: header,
      easing: 'easeInOutQuad',
      duration: 400,
      delay: 500,
      marginBottom: visible ? 0 : -height,
    })

    return () => {
      anime.remove(animation)
      anime.remove(marginAnimation)
    }
  }, [visible])

  return (
    <header
      ref={ref}
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
  )
}
