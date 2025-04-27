import { useState } from 'react'
import { Listbox, ListboxItem } from '@nextui-org/listbox'
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
      <Listbox
        label="AI provider"
        variant="flat"
        color="primary"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={selectedAiProvider ? [selectedAiProvider] : []}
        onSelectionChange={(selection) =>
          selection !== 'all' &&
          setSelectedAiProvider(selection.values().next().value)
        }
      >
        {aiProviders.map((provider) => (
          <ListboxItem key={provider} value={provider}>
            {provider}
          </ListboxItem>
        ))}
      </Listbox>
    </Dialog>
  )
}
