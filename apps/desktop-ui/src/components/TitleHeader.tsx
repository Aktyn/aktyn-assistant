import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { palette } from '../utils/palette'

const words = 'Aktyn Assistant'.split(/\s/)

export const TitleHeader = () => {
  const ref = useRef<HTMLHeadingElement>(null)

  const visible = true

  useEffect(() => {
    const header = ref.current
    if (!header) {
      return
    }

    const height = header.getBoundingClientRect().height
    const animation = anime({
      targets: header.childNodes,
      // easing: 'easeInOutSine',
      // duration: 800,
      easing: 'spring(1, 80, 10, 0)',
      delay: anime.stagger(200, { from: visible ? 'last' : 'first' }),
      translateY: visible ? [-(height ?? 0), 0] : [0, -height],
      opacity: visible ? 1 : 0,
      marginBottom: visible ? 0 : -height,
    })

    return () => {
      anime.remove(animation)
    }
  }, [])

  return (
    <header
      ref={ref}
      className="ai-font flex flex-wrap justify-center text-center font-thin text-8xl px-4 py-8 min-w-min mx-auto gap-x-16 pointer-events-none"
    >
      {words.map((word, index) => (
        <span
          key={index}
          className="opacity-0 relative pointer-events-none"
          style={{
            background: `linear-gradient(160deg, ${palette.gradientColorPrimary}, ${palette.gradientColorSecondary}) text`,
            color: '#fff8',
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
