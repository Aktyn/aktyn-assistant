import Icon from '@mdi/react'
import { Button, type ButtonProps } from '@nextui-org/button'
import { cn } from '@nextui-org/react'

type IconButtonProps = {
  icon: string
} & ButtonProps

export const IconButton = ({ icon, ...buttonProps }: IconButtonProps) => {
  return (
    <Button
      radius="full"
      variant="light"
      isIconOnly
      {...buttonProps}
      className={cn(
        'data-[hover=true]:bg-foreground-50/25 text-current',
        buttonProps.className,
      )}
    >
      <Icon path={icon} size="1.25rem" color="currentColor" />
    </Button>
  )
}
