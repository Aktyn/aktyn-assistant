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
        'backdrop-blur-[8px] border-1 border-divider bg-gradient-to-br from-primary-200/10 to-secondary-200/10 !transition-colors',
        props.className,
      )}
    />
  )
})
