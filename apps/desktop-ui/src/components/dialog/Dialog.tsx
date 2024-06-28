import type { PropsWithChildren } from 'react'
import { Button } from '@nextui-org/button'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  type ModalProps,
} from '@nextui-org/modal'

type DialogProps = PropsWithChildren<
  {
    title?: string
    onCancel?: () => void
    onConfirm?: () => void
    disableConfirmButton?: boolean
  } & Omit<ModalProps, 'children'>
>

export const Dialog = ({
  title,
  children,
  onCancel,
  onConfirm,
  disableConfirmButton,
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
      }}
      {...modalProps}
    >
      <ModalContent>
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody>{children}</ModalBody>
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
            >
              Confirm
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
