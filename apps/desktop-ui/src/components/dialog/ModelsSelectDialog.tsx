import { useEffect, useState } from 'react'
import { Divider } from '@nextui-org/divider'
import { Listbox, ListboxItem } from '@nextui-org/listbox'
import { Spinner } from '@nextui-org/spinner'
import { Dialog } from './Dialog'

type ChatModelSelectDialogProps = {
  open: boolean
  onClose: () => void
}

export const ModelsSelectDialog = ({
  open,
  onClose,
}: ChatModelSelectDialogProps) => {
  const [chatModel, setChatModel] = useState<string | null>(null)
  const [imageGenerationModel, setImageGenerationModel] = useState<
    string | null
  >(null)
  const [models, setModels] = useState<
    Record<'chatModels' | 'imageModels', string[]>
  >({ chatModels: [], imageModels: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      window.electronAPI
        .getAvailableModels()
        .then((models) => {
          setModels(models)
          setLoading(false)
        })
        .catch(console.error)
    }
  }, [open])

  return (
    <Dialog
      size="xl"
      isOpen={open}
      isDismissable={false}
      isKeyboardDismissDisabled
      title="Select model from each list"
      disableConfirmButton={!chatModel || !imageGenerationModel}
      onConfirm={() => {
        if (!chatModel || !imageGenerationModel) {
          return
        }
        window.electronAPI.setUserConfigValue('selectedChatModel', chatModel)
        window.electronAPI.setUserConfigValue(
          'selectedImageGenerationModel',
          imageGenerationModel,
        )
        onClose()
      }}
    >
      {models.chatModels.length > 0 && models.imageModels.length > 0 ? (
        <div className="grid grid-cols-[1fr_1px_1fr] gap-x-4">
          <Listbox
            topContent={
              <span className="font-semibold text-lg text-foreground-300">
                Chat model
              </span>
            }
            label="Chat model"
            variant="flat"
            color="primary"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={chatModel ? [chatModel] : []}
            onSelectionChange={(selection) => {
              if (selection !== 'all') {
                setChatModel(selection.values().next().value)
              }
            }}
          >
            {models.chatModels.map((model) => (
              <ListboxItem key={model} value={model}>
                {model}
              </ListboxItem>
            ))}
          </Listbox>
          <Divider orientation="vertical" />
          <Listbox
            topContent={
              <span className="font-semibold text-lg text-foreground-300">
                Image generation model
              </span>
            }
            label="Image generation model"
            variant="flat"
            color="primary"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={imageGenerationModel ? [imageGenerationModel] : []}
            onSelectionChange={(selection) => {
              if (selection !== 'all') {
                setImageGenerationModel(selection.values().next().value)
              }
            }}
          >
            {models.imageModels.map((model) => (
              <ListboxItem key={model} value={model}>
                {model}
              </ListboxItem>
            ))}
          </Listbox>
        </div>
      ) : loading ? (
        <Spinner size="lg" color="current" />
      ) : (
        <div className="text-deepOrange-200 font-bold text-xl text-center text-balance">
          No models available!
          <br />
          This should not happen, please report this issue!
        </div>
      )}
    </Dialog>
  )
}
