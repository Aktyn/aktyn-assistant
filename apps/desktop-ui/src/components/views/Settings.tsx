import { GlassCard } from '@/components/common/GlassCard'
import { CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUserConfigValue } from '@/hooks/useUserConfigValue'
import { gttsLanguages } from '@aktyn-assistant/common'
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Label } from '../ui/label'

export const Settings = ({ in: active }: { in?: boolean }) => {
  const [models, setModels] = useState<
    Record<'chatModels' | 'imageModels', string[]>
  >({ chatModels: [], imageModels: [] })

  const [chatModel, setChatModel, syncChatModel] =
    useUserConfigValue('selectedChatModel')
  const [
    imageGenerationModel,
    setImageGenerationModel,
    syncImageGenerationModel,
  ] = useUserConfigValue('selectedImageGenerationModel')
  const [mockPaidRequests, setMockPaidRequests, syncMockPaidRequests] =
    useUserConfigValue('mockPaidRequests')
  const [launchOnStartup, setLaunchOnStartup, syncLaunchOnStartup] =
    useUserConfigValue('autoLaunch')
  const [launchHidden, setLaunchHidden, syncLaunchHidden] =
    useUserConfigValue('launchHidden')
  const [useHistory, setUseHistory, syncUseHistory] =
    useUserConfigValue('includeHistory')
  const [maxHistoryLength, setMaxHistoryLength, syncMaxHistoryLength] =
    useUserConfigValue('maxChatHistoryLength')
  const [readChatResponses, setReadChatResponses, syncReadChatResponses] =
    useUserConfigValue('readChatResponses')
  const [
    textToSpeechLanguage,
    setTextToSpeechLanguage,
    syncTextToSpeechLanguage,
  ] = useUserConfigValue('textToSpeechLanguage')
  const [
    initialSystemMessage,
    setInitialSystemMessage,
    syncInitialSystemMessage,
  ] = useUserConfigValue('initialSystemMessage')

  const syncSettings = useCallback(async () => {
    void syncChatModel()
    void syncImageGenerationModel()
    void syncMockPaidRequests()
    void syncLaunchOnStartup()
    void syncLaunchHidden()
    void syncUseHistory()
    void syncMaxHistoryLength()
    void syncReadChatResponses()
    void syncTextToSpeechLanguage()
    void syncInitialSystemMessage()
  }, [
    syncChatModel,
    syncImageGenerationModel,
    syncLaunchHidden,
    syncLaunchOnStartup,
    syncMaxHistoryLength,
    syncMockPaidRequests,
    syncUseHistory,
    syncReadChatResponses,
    syncTextToSpeechLanguage,
    syncInitialSystemMessage,
  ])

  useEffect(() => {
    if (active) {
      syncSettings().catch(console.error)
    }
  }, [active, syncSettings])

  useEffect(() => {
    const fetchInitialData = async () => {
      const models = await window.electronAPI.getAvailableModels()
      if (!models.chatModels.length) {
        throw new Error('No AI chat models available')
      }
      setModels(models)

      await syncSettings()
    }

    fetchInitialData().catch(console.error)
  }, [syncSettings])

  const handleMaxHistoryLengthChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = parseInt(event.target.value)
    if (!isNaN(value)) {
      value = Math.max(1, Math.min(value, 32))
      setMaxHistoryLength(value)
      window.electronAPI.setUserConfigValue('maxChatHistoryLength', value)
    }
  }

  const toggleLaunchOnStartup = async (checked: boolean) => {
    setLaunchOnStartup(checked, true)

    try {
      const success = await window.electronAPI.setAutoLaunch(checked)
      if (!success) {
        toast.error('Failed to set auto launch')
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="my-auto py-4">
      <GlassCard className="overflow-visible">
        <CardContent className="grid grid-cols-2 xl:grid-cols-4 items-stretch gap-2 overflow-visible">
          <Section title="General">
            <div>
              <Label>AI Provider</Label>
              <Select value="OpenAI" onValueChange={() => {}}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Checkbox
                id="mock-paid-requests"
                checked={!!mockPaidRequests}
                onCheckedChange={setMockPaidRequests}
              />
              <Label htmlFor="mock-paid-requests">Mock paid requests</Label>
            </div>
            <div>
              <Checkbox
                id="launch-on-startup"
                checked={!!launchOnStartup}
                onCheckedChange={toggleLaunchOnStartup}
              />
              <Label htmlFor="launch-on-startup">Launch on startup</Label>
            </div>
            <div>
              <Checkbox
                id="launch-hidden"
                checked={!!launchHidden}
                onCheckedChange={setLaunchHidden}
              />
              <Label htmlFor="launch-hidden">Launch hidden</Label>
            </div>
          </Section>

          <Section title="Media">
            <div>
              <Label>Image generation model</Label>
              <Select
                value={imageGenerationModel ?? ''}
                onValueChange={setImageGenerationModel}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Image Generation Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.imageModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="read-chat-responses"
                checked={!!readChatResponses}
                onCheckedChange={setReadChatResponses}
              />
              <Label htmlFor="read-chat-responses">Read chat responses</Label>
            </div>
            <div>
              <Label>TTS Language</Label>
              <Select
                value={textToSpeechLanguage ?? ''}
                onValueChange={setTextToSpeechLanguage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="TTS Language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(gttsLanguages).map(([key, language]) => (
                    <SelectItem key={key} value={key}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section title="Chat">
            <div>
              <Label>Chat model</Label>
              <Select value={chatModel ?? ''} onValueChange={setChatModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chat Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.chatModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="include-history"
                checked={!!useHistory}
                onCheckedChange={setUseHistory}
              />
              <Label htmlFor="include-history">Include history</Label>
            </div>
            <div>
              <Label htmlFor="previous-messages">
                Previous messages sent to AI
              </Label>
              <Input
                id="previous-messages"
                className="min-w-56"
                type="number"
                min="1"
                max="32"
                value={(maxHistoryLength ?? 8).toString()}
                onChange={handleMaxHistoryLengthChange}
                disabled={!useHistory}
              />
            </div>
          </Section>

          <Section title="Assistant">
            <Textarea
              placeholder="Enter message that tells the AI about its purpose and how to respond to user's questions"
              value={initialSystemMessage ?? ''}
              onChange={(e) => setInitialSystemMessage(e.target.value)}
              className="h-full max-h-full"
            />
          </Section>
        </CardContent>
      </GlassCard>
    </div>
  )
}

const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  return (
    <div className="settings-section flex flex-col justify-start gap-y-2 bg-background/20 shadow-inner shadow-black/20 border-1 rounded-lg py-2 px-4">
      <span className="text-lg font-semibold text-center text-foreground">
        {title}
      </span>
      {children}
    </div>
  )
}
