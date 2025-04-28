import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

const segments = 9

type SpeechSynthesisIndicatorProps = {
  active: boolean
  onCancel: () => void
}

export const SpeechSynthesisIndicator = ({
  active,
  onCancel,
}: SpeechSynthesisIndicatorProps) => {
  const ref = useRef<HTMLDivElement>(null)

  //TODO: Add animation
  // useEffect(() => {
  //   const container = ref.current
  //   if (!container || !active) {
  //     return
  //   }

  //   const duration = 800
  //   const animation = anime({
  //     targets: container.querySelectorAll('.segment'),
  //     easing: 'easeInOutCirc',
  //     duration,
  //     delay: anime.stagger(80, { from: 'center', start: -400 }),
  //     height: ['0.5rem', '1.5rem', '0.5rem'],
  //     scale: anime.stagger([1.2, 0.8], { from: 'center' }),
  //     backgroundColor: [
  //       palette.textColorSecondary,
  //       palette.colorActive,
  //       palette.textColorSecondary,
  //     ],
  //     direction: 'alternate',
  //     loop: true,
  //   })

  //   return () => {
  //     anime.remove(animation)
  //   }
  // }, [active])

  return (
    <div
      ref={ref}
      className={cn(
        'h-full min-w-32 flex flex-row items-center justify-center gap-x-[0.0625rem] overflow-visible relative',
        !active && 'pointer-events-none',
      )}
    >
      {Array.from({ length: segments }).map((_, index) => (
        <span
          key={index}
          className="segment h-[0.5rem] w-[0.5rem] rounded-full bg-foreground-600"
          style={{
            opacity: Math.pow(1 - Math.abs(index - segments / 2) / segments, 3),
          }}
        />
      ))}
      <div className="absolute top-0 left-0 h-full flex flex-row items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-500 z-10">
        <Button
          size="sm"
          variant="default"
          className="font-bold backdrop-blur-sm rounded-full"
          onClick={onCancel}
        >
          Cancel speaking
        </Button>
      </div>
    </div>
  )
}
