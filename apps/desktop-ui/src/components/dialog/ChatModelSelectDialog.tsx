import { useEffect, useState } from 'react'
import { Listbox, ListboxItem } from '@nextui-org/listbox'
import { Spinner } from '@nextui-org/spinner'
import { Dialog } from './Dialog'

type ChatModelSelectDialogProps = {
  open: boolean
  onClose: () => void
}

export const ChatModelSelectDialog = ({
  open,
  onClose,
}: ChatModelSelectDialogProps) => {
  const [chatModel, setChatModel] = useState<string | null>(null)
  const [models, setModels] = useState<string[]>([])
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
      isOpen={open}
      isDismissable={false}
      isKeyboardDismissDisabled
      title="Select chat model"
      disableConfirmButton={!chatModel}
      onConfirm={() => {
        if (!chatModel) {
          return
        }
        window.electronAPI.setUserConfigValue('selectedChatModel', chatModel)
        onClose()
      }}
    >
      {models.length > 0 ? (
        <Listbox
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
          {models.map((model) => (
            <ListboxItem key={model} value={model}>
              {model}
            </ListboxItem>
          ))}
        </Listbox>
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
