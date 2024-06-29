import { forwardRef } from 'react'
import { Card, type CardProps } from '@nextui-org/card'
import { cn } from '@nextui-org/theme'

export const GlassCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  // TODO: add noise effect to the background
  return (
    <Card
      {...props}
      ref={ref}
      isBlurred
      className={cn(
        props.className,
        'backdrop-blur-[8px] border-1 border-divider bg-gradient-to-br from-primary-200/10 to-secondary-200/10 !transition-none',
      )}
    />
  )
})
