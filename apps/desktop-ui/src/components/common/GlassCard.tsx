import { Card, type CardProps } from '@nextui-org/card'
import { clsx } from '../../utils/common'

export const GlassCard = (props: CardProps) => {
  return (
    <Card
      {...props}
      isBlurred
      className={clsx(
        props.className,
        'backdrop-blur-[8px] border-1 border-divider bg-gradient-to-br from-primary-200/10 to-secondary-200/10 !transition-none',
      )}
    />
  )
}
