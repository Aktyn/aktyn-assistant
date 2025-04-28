import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { gttsLanguages } from '@aktyn-assistant/common'
import { CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { GlassCard } from '../components/common/GlassCard'
import { useUserConfigValue } from '../hooks/useUserConfigValue'

export const Settings = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const container = ref.current
    if (!container) {
      return
    }

    //TODO: Add animation
    // const animation = anime({
    //   targets: container.querySelectorAll('.settings-section'),
    //   easing: 'spring(1, 80, 10, 0)',
    //   scale: active ? 1 : 0.618,
    //   opacity: active ? 1 : 0,
    //   rotate: active ? 0 : anime.stagger(['-30deg', '30deg']),
    //   delay: anime.stagger(200, { from: 'center' }),
    // })

    // return () => {
    //   anime.remove(animation)
    // }
  }, [active])

  return (
    <div ref={ref} className="my-auto py-4">
      <GlassCard className="overflow-visible">
        <CardContent className="grid grid-cols-2 xl:grid-cols-4 items-stretch gap-2 overflow-visible">
          <Section title="General">
            <Select value="OpenAI" onValueChange={() => {}}>
              <SelectItem value="OpenAI">OpenAI</SelectItem>
            </Select>
            <Checkbox
              checked={!!mockPaidRequests}
              onCheckedChange={setMockPaidRequests}
            >
              Mock paid requests
            </Checkbox>
            <Checkbox
              checked={!!launchOnStartup}
              onCheckedChange={toggleLaunchOnStartup}
            >
              Launch on startup
            </Checkbox>
            <Checkbox
              checked={!!launchHidden}
              onCheckedChange={setLaunchHidden}
            >
              Launch hidden
            </Checkbox>
          </Section>

          <Section title="Media">
            <Select
              value={imageGenerationModel ?? ''}
              onValueChange={setImageGenerationModel}
            >
              {models.imageModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </Select>
            <Checkbox
              checked={!!readChatResponses}
              onCheckedChange={setReadChatResponses}
            >
              Read chat responses
            </Checkbox>
            <Select
              value={textToSpeechLanguage ?? ''}
              onValueChange={setTextToSpeechLanguage}
            >
              {Object.entries(gttsLanguages).map(([key, language]) => (
                <SelectItem key={key} value={key}>
                  {language}
                </SelectItem>
              ))}
            </Select>
          </Section>

          <Section title="Chat">
            <Select value={chatModel ?? ''} onValueChange={setChatModel}>
              {models.chatModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </Select>
            <Checkbox checked={!!useHistory} onCheckedChange={setUseHistory}>
              Include history
            </Checkbox>
            <Input
              className="min-w-56"
              type="number"
              min="1"
              max="32"
              value={(maxHistoryLength ?? 8).toString()}
              onChange={handleMaxHistoryLengthChange}
              disabled={!useHistory}
              aria-label="Previous messages sent to AI"
            />
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
    <div className="settings-section flex flex-col justify-start gap-y-2 bg-background/20 shadow-inner shadow-black/20 border-1 border-divider/5 rounded-lg py-2 px-4">
      <span className="text-lg font-semibold text-center text-foreground-400">
        {title}
      </span>
      {children}
    </div>
  )
}
