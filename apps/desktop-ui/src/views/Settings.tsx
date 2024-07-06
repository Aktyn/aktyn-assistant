import {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { CardBody } from '@nextui-org/card'
import { Checkbox } from '@nextui-org/checkbox'
import { Input, Textarea } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import anime from 'animejs'
import { enqueueSnackbar } from 'notistack'
import { GlassCard } from '../components/common/GlassCard'
import { GlobalContext } from '../context/GlobalContextProvider'
import { useUserConfigValue } from '../hooks/useUserConfigValue'

export const Settings = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { initData } = useContext(GlobalContext)

  const [models, setModels] = useState<string[]>([])

  const [chatModel, setChatModel, syncChatModel] =
    useUserConfigValue('selectedChatModel')
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
    initialSystemMessage,
    setInitialSystemMessage,
    syncInitialSystemMessage,
  ] = useUserConfigValue('initialSystemMessage')

  const syncSettings = useCallback(async () => {
    void syncChatModel()
    void syncMockPaidRequests()
    void syncLaunchOnStartup()
    void syncLaunchHidden()
    void syncUseHistory()
    void syncMaxHistoryLength()
    void syncReadChatResponses()
    void syncInitialSystemMessage()
  }, [
    syncChatModel,
    syncLaunchHidden,
    syncLaunchOnStartup,
    syncMaxHistoryLength,
    syncMockPaidRequests,
    syncUseHistory,
    syncReadChatResponses,
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
      if (!models.length) {
        throw new Error('No AI models available')
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

  initData?.autoLaunchEnabled
  const toggleLaunchOnStartup = async (checked: boolean) => {
    setLaunchOnStartup(checked, true)

    try {
      const success = await window.electronAPI.setAutoLaunch(checked)
      if (!success) {
        enqueueSnackbar({
          variant: 'error',
          message: 'Failed to set auto launch',
        })
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

    const animation = anime({
      targets: container.querySelectorAll('.settings-section'),
      easing: 'spring(1, 80, 10, 0)',
      scale: active ? 1 : 0.618,
      opacity: active ? 1 : 0,
      rotate: active ? 0 : anime.stagger(['-30deg', '30deg']),
      delay: anime.stagger(200, { from: 'center' }),
    })

    return () => {
      anime.remove(animation)
    }
  }, [active])

  return (
    <div ref={ref} className="my-auto py-4">
      <GlassCard className="overflow-visible">
        <CardBody className="grid grid-cols-2 xl:grid-cols-4 items-stretch gap-2 overflow-visible">
          <Section title="General">
            <Select
              label="AI provider"
              selectedKeys={['OpenAI']}
              variant="underlined"
            >
              <SelectItem key="OpenAI" value="OpenAI">
                OpenAI
              </SelectItem>
            </Select>
            <Checkbox
              color="default"
              isSelected={!!mockPaidRequests}
              onValueChange={setMockPaidRequests}
            >
              Mock paid requests
            </Checkbox>
            <Checkbox
              color="default"
              isSelected={!!launchOnStartup}
              onValueChange={toggleLaunchOnStartup}
            >
              Launch on startup
            </Checkbox>
            <Checkbox
              color="default"
              isSelected={!!launchHidden}
              onValueChange={setLaunchHidden}
            >
              Launch hidden
            </Checkbox>
          </Section>

          <Section title="Audio">
            <Checkbox
              color="default"
              isSelected={!!readChatResponses}
              onValueChange={setReadChatResponses}
            >
              Read chat responses
            </Checkbox>
          </Section>

          <Section title="Chat">
            <Select
              label="Chat model"
              variant="underlined"
              selectedKeys={
                chatModel && models.includes(chatModel) ? [chatModel] : []
              }
              onSelectionChange={(keys) => {
                if (keys instanceof Set) {
                  setChatModel(keys.values().next().value)
                }
              }}
            >
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </Select>
            <Checkbox
              color="default"
              isSelected={!!useHistory}
              onValueChange={setUseHistory}
            >
              Include history
            </Checkbox>
            <Input
              className="min-w-56"
              variant="underlined"
              type="number"
              min="1"
              max="32"
              value={(maxHistoryLength ?? 8).toString()}
              onChange={handleMaxHistoryLengthChange}
              isDisabled={!useHistory}
              label={
                <span className="text-nowrap">
                  Previous messages sent to AI
                </span>
              }
            />
          </Section>

          <Section title="Assistant">
            <Textarea
              variant="faded"
              label="Initial system message"
              labelPlacement="outside"
              placeholder="Enter message that tells the AI about its purpose and how to respond to user's questions"
              maxRows={5}
              value={initialSystemMessage ?? ''}
              onValueChange={setInitialSystemMessage}
              className="h-full max-h-full"
              classNames={{
                inputWrapper:
                  'flex-grow max-h-full border-1 border-foreground-400/50 bg-foreground-600/10 rounded-md',
                input: 'placeholder:text-foreground-700',
              }}
            />
          </Section>
        </CardBody>
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
