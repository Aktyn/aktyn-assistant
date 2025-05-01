import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog } from './Dialog'
import type { ModelType } from '@aktyn-assistant/core'

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
  const [models, setModels] = useState<{ [key in `${ModelType}`]: string[] }>({
    chat: [],
    image: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      window.electronAPI
        .getAvailableModels('chat', 'image')
        .then((models) => {
          setModels(models)
          setLoading(false)
        })
        .catch(console.error)
    }
  }, [open])

  return (
    <Dialog
      onClose={onClose}
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
      {models.chat.length > 0 && models.image.length > 0 ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-start">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-lg text-muted-foreground">
              Chat model
            </span>
            <Select
              value={chatModel ?? undefined}
              onValueChange={(value: string) => {
                setChatModel(value)
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a chat model" />
              </SelectTrigger>
              <SelectContent>
                {models.chat.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-lg text-muted-foreground">
              Image generation model
            </span>
            <Select
              value={imageGenerationModel ?? undefined}
              onValueChange={(value: string) => {
                setImageGenerationModel(value)
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an image model" />
              </SelectTrigger>
              <SelectContent>
                {models.image.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center min-h-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="text-destructive font-bold text-xl text-center text-balance">
          No models available!
          <br />
          This should not happen, please report this issue!
        </div>
      )}
    </Dialog>
  )
}
