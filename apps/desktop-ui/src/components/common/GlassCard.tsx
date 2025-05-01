import { forwardRef } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const GlassCard = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card>
>((props, ref) => {
  return (
    <Card
      {...props}
      ref={ref}
      className={cn(
        'backdrop-blur-sm bg-background/40 bg-linear-160 from-foreground/10 via-background/20 to-foreground/10 will-change-[backdrop-filter,opacity,transform]',
        props.className,
      )}
    />
  )
})
