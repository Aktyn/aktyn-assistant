import { SelectContent, SelectItem, SelectValue } from '../ui/select'
import { SelectTrigger } from '../ui/select'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { useUserConfigValue } from '@/hooks/useUserConfigValue'
import { useContext, useEffect, useState } from 'react'
import { GlobalContext } from '@/context/GlobalContextProvider'
import type { ModelType } from '@aktyn-assistant/core'

type ChatModelSelectProps = {
  type: `${ModelType}`
  inView?: boolean
}

export function ChatModelSelect({ type, inView = true }: ChatModelSelectProps) {
  const { ready } = useContext(GlobalContext)

  const [chatModel, setChatModel, syncChatModel] = useUserConfigValue(
    type === 'chat' ? 'selectedChatModel' : 'selectedImageGenerationModel',
  )

  const [models, setModels] = useState({ [type]: [] as string[] })

  useEffect(() => {
    if (ready && inView) {
      void syncChatModel()

      let mounted = true
      window.electronAPI
        .getAvailableModels(type)
        .then((models) => {
          if (!mounted) {
            return
          }

          if (!models[type]?.length) {
            throw new Error('No AI chat models available')
          }
          setModels(models)
        })
        .catch(console.error)

      return () => {
        mounted = false
      }
    }
  }, [ready, syncChatModel, type, inView])

  return (
    <div>
      {type === 'chat' && <Label>Chat model</Label>}
      {type === 'image' && <Label>Image generation model</Label>}
      <Select value={chatModel ?? ''} onValueChange={setChatModel}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              type === 'chat' ? 'Chat Model' : 'Image Generation Model'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {models[type]?.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
