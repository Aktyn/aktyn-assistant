import type { PropsWithChildren, ReactNode } from 'react'
import { Button } from '@nextui-org/button'
import {
  Modal,
  ModalBody,
  type ModalBodyProps,
  ModalContent,
  ModalFooter,
  ModalHeader,
  type ModalProps,
} from '@nextui-org/modal'

type DialogProps = PropsWithChildren<
  {
    title?: ReactNode
    onCancel?: () => void
    onConfirm?: () => void
    disableConfirmButton?: boolean
    isLoading?: boolean
    bodyProps?: ModalBodyProps
  } & Omit<ModalProps, 'children' | 'title'>
>

export const Dialog = ({
  title,
  children,
  onCancel,
  onConfirm,
  disableConfirmButton,
  isLoading,
  bodyProps,
  ...modalProps
}: DialogProps) => {
  return (
    <Modal
      scrollBehavior="inside"
      backdrop="blur"
      hideCloseButton
      classNames={{
        backdrop:
          'backdrop-blur-sm bg-gradient-to-br from-primary-700/15 to-secondary-700/15',
        wrapper: 'overflow-hidden',
      }}
      {...modalProps}
    >
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody {...bodyProps}>{children}</ModalBody>
        <ModalFooter>
          {onCancel && (
            <Button color="secondary" onPress={onCancel}>
              Cancel
            </Button>
          )}
          {onConfirm && (
            <Button
              color="primary"
              isDisabled={disableConfirmButton}
              onPress={onConfirm}
              isLoading={isLoading}
            >
              Confirm
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
