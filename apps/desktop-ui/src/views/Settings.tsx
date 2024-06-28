import { useCallback, useContext, useEffect, useState } from 'react'
import { CardBody } from '@nextui-org/card'
import { Checkbox } from '@nextui-org/checkbox'
import { Input } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import { enqueueSnackbar } from 'notistack'
import { GlassCard } from '../components/common/GlassCard'
import { GlobalContext } from '../context/GlobalContextProvider'
import { useUserConfigValue } from '../hooks/useUserConfigValue'

export const Settings = ({ in: active }: { in?: boolean }) => {
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

  const syncSettings = useCallback(async () => {
    void syncChatModel()
    void syncMockPaidRequests()
    void syncLaunchOnStartup()
    void syncLaunchHidden()
    void syncUseHistory()
    void syncMaxHistoryLength()
  }, [
    syncChatModel,
    syncLaunchHidden,
    syncLaunchOnStartup,
    syncMaxHistoryLength,
    syncMockPaidRequests,
    syncUseHistory,
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

      //TODO: prompt user to select model and mock paid requests if not set
      let chatModel =
        await window.electronAPI.getUserConfigValue('selectedChatModel')
      if (!chatModel && models.length > 0) {
        console.warn('No chat model selected, using first available')
        chatModel = models[0]
        window.electronAPI.setUserConfigValue('selectedChatModel', chatModel)
      }

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

  return (
    <GlassCard className="my-auto overflow-visible">
      <CardBody className="gap-y-2">
        <Select
          label="AI provider"
          selectedKeys={['OpenAI']}
          variant="underlined"
        >
          <SelectItem key="OpenAI" value="OpenAI">
            OpenAI
          </SelectItem>
        </Select>

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
          isSelected={!!mockPaidRequests}
          onValueChange={(checked) => {
            setMockPaidRequests(checked)
          }}
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
          onValueChange={(checked) => {
            setLaunchHidden(checked)
          }}
        >
          Launch hidden
        </Checkbox>

        <Checkbox
          color="default"
          isSelected={!!useHistory}
          onValueChange={(checked) => {
            setUseHistory(checked)
          }}
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
          label={
            <span className="text-nowrap">Previous messages sent to AI</span>
          }
        />
      </CardBody>
    </GlassCard>
  )
}
