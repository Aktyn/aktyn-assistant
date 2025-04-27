import { forwardRef } from 'react'
import Icon from '@mdi/react'
import { Button, type ButtonProps } from '@nextui-org/button'
import { cn } from '@nextui-org/react'

type IconButtonProps = {
  icon: string
  activeIcon?: string
  active?: boolean
} & ButtonProps

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, activeIcon, active, ...buttonProps }, ref) => {
    return (
      <Button
        ref={ref}
        radius="full"
        variant="light"
        isIconOnly
        {...buttonProps}
        className={cn(
          'data-[hover=true]:bg-foreground-50/25 text-current relative *:absolute *:transition-[opacity,transform]',
          buttonProps.className,
        )}
      >
        <Icon
          path={icon}
          size="1.25rem"
          color="currentColor"
          className={cn(
            active ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0',
          )}
        />
        {activeIcon && (
          <Icon
            path={activeIcon}
            size="1.25rem"
            color="currentColor"
            className={cn(
              active ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90',
            )}
          />
        )}
      </Button>
    )
  },
)
