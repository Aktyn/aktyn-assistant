import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog } from './Dialog'

type AiProviderSelectDialogProps = {
  open: boolean
  onClose: () => void
  aiProviders: string[]
}

export const AiProviderSelectDialog = ({
  open,
  onClose,
  aiProviders,
}: AiProviderSelectDialogProps) => {
  const [selectedAiProvider, setSelectedAiProvider] = useState<string | null>(
    null,
  )

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      isDismissable={false}
      isKeyboardDismissDisabled
      title="Select AI provider"
      disableConfirmButton={!selectedAiProvider}
      onConfirm={() => {
        if (!selectedAiProvider) {
          return
        }
        window.electronAPI.promptAiProviderCallback(selectedAiProvider as never)
        onClose()
      }}
    >
      <Select
        value={selectedAiProvider ?? ''}
        onValueChange={(value) => setSelectedAiProvider(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI provider" />
        </SelectTrigger>
        <SelectContent>
          {aiProviders.map((provider) => (
            <SelectItem key={provider} value={provider}>
              {provider}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Dialog>
  )
}
