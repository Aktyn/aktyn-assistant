import { useState } from 'react'
import { Input } from '@/components/ui/input'
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
      onClose={onClose}
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
        required
        value={apiKeyValue ?? ''}
        onChange={(e) => setApiKeyValue(e.target.value)}
        placeholder="API key"
      />
    </Dialog>
  )
}
