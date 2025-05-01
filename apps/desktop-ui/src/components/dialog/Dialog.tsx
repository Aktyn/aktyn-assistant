import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as ShadDialog,
} from '@/components/ui/dialog'
import type { PropsWithChildren, ReactNode } from 'react'

type DialogProps = PropsWithChildren<
  {
    title?: ReactNode
    onCancel?: () => void
    onConfirm?: () => void
    disableConfirmButton?: boolean
    isLoading?: boolean
    // bodyProps?: ModalBodyProps // bodyProps might not directly map
  } & Omit<
    React.ComponentPropsWithoutRef<typeof ShadDialog>,
    'open' | 'onOpenChange'
  > & {
      isOpen: boolean
      onClose: () => void
      isDismissable?: boolean
      isKeyboardDismissDisabled?: boolean
    }
>

/** @deprecated Use the Dialog component from @/components/ui/dialog instead */
export const Dialog = ({
  title,
  children,
  onCancel,
  onConfirm,
  disableConfirmButton,
  isLoading,
  // bodyProps, // Ignoring bodyProps for now
  isOpen,
  onClose,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  ...dialogProps
}: DialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleInteractOutside = (event: Event) => {
    if (!isDismissable) {
      event.preventDefault()
    }
  }

  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (isKeyboardDismissDisabled) {
      event.preventDefault()
    }
  }

  return (
    <ShadDialog open={isOpen} onOpenChange={handleOpenChange} {...dialogProps}>
      <DialogContent
        aria-describedby={undefined}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className="sm:max-w-[425px]"
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {/* Optional: Add DialogDescription if needed */}
          </DialogHeader>
        )}
        <div className="grid gap-4 py-4">
          {' '}
          {/* Replaces ModalBody */}
          {children}
        </div>
        <DialogFooter>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onConfirm && (
            <Button
              type="submit" // Assuming confirmation might submit a form
              disabled={disableConfirmButton || isLoading} // Combine disabled states
              onClick={onConfirm}
            >
              {isLoading ? 'Loading...' : 'Confirm'}{' '}
              {/* Add loading state display */}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </ShadDialog>
  )
}
