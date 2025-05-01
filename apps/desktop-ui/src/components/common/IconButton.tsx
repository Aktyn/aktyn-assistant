import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IconButtonProps = {
  icon: React.ElementType
  activeIcon?: React.ElementType
  active?: boolean
} & React.ComponentProps<typeof Button>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, activeIcon: ActiveIcon, active, ...buttonProps }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        {...buttonProps}
        className={cn(
          'rounded-full! p-2 aspect-square min-w-auto data-[hover=true]:bg-foreground-50/25 relative *:absolute *:inset-auto *:transition-[opacity,rotate] cursor-pointer',
          buttonProps.className,
        )}
      >
        <Icon
          className={cn(
            'size-5',
            active ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0',
          )}
        />
        {ActiveIcon && (
          <ActiveIcon
            className={cn(
              'size-5',
              active ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90',
            )}
          />
        )}
      </Button>
    )
  },
)
