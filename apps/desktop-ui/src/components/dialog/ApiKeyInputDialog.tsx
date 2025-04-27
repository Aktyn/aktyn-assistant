import { useState } from 'react'
import { Input } from '@nextui-org/input'
import { Dialog } from './Dialog'

type ApiKeyInputDialogProps = {
  open: boolean
  onClose: () => void
  apiKeyProviderType: string
}

export const ApiKeyInputDialog = ({
  open,
  onClose,
  apiKeyProviderType,
}: ApiKeyInputDialogProps) => {
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null)

  return (
    <Dialog
      isOpen={open}
      isDismissable={false}
      isKeyboardDismissDisabled
      title={`Enter API key for ${apiKeyProviderType}`}
      disableConfirmButton={!apiKeyValue}
      onConfirm={() => {
        if (!apiKeyValue) {
          return
        }
        window.electronAPI.promptApiKeyCallback(apiKeyValue)
        onClose()
      }}
    >
      <Input
        size="lg"
        variant="bordered"
        label="API key"
        isRequired
        value={apiKeyValue ?? ''}
        onChange={(value) => setApiKeyValue(value.target.value)}
      />
    </Dialog>
  )
}
