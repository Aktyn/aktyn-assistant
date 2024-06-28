import { useCallback, useContext, useEffect, useState } from 'react'
import { CardBody } from '@nextui-org/card'
import { Checkbox } from '@nextui-org/checkbox'
import { Input } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import { GlassCard } from '../components/common/GlassCard'
import { GlobalContext } from '../context/GlobalContextProvider'

export const Settings = ({ in: active }: { in?: boolean }) => {
  const { initData } = useContext(GlobalContext)

  //TODO: useUserConfigValue() hook
  const [models, setModels] = useState<string[]>([])
  const [chatModel, setChatModel] = useState<string | null>(null)
  const [mockPaidRequests, setMockPaidRequests] = useState<boolean>(false)
  const [launchOnStartup, setLaunchOnStartup] = useState<boolean>(false)
  const [launchHidden, setLaunchHidden] = useState<boolean>(false)
  const [useHistory, setUseHistory] = useState<boolean>(false)
  const [maxHistoryLength, setMaxHistoryLength] = useState<number>(1)

  const syncSettings = useCallback(async () => {
    setChatModel(
      await window.electronAPI.getUserConfigValue('selectedChatModel'),
    )
    setMockPaidRequests(
      !!(await window.electronAPI.getUserConfigValue('mockPaidRequests')),
    )
    setLaunchOnStartup(
      await window.electronAPI.getUserConfigValue('autoLaunch'),
    )
    setLaunchHidden(await window.electronAPI.getUserConfigValue('launchHidden'))
    setUseHistory(await window.electronAPI.getUserConfigValue('includeHistory'))
    setMaxHistoryLength(
      await window.electronAPI.getUserConfigValue('maxChatHistoryLength'),
    )
  }, [])

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
    setLaunchOnStartup(checked)

    try {
      const success = await window.electronAPI.setAutoLaunch(checked)
      if (!success) {
        //TODO: show error notification
        // Notifications.provider.showNotification(Notifications.type.Error, {
        //   message: 'Failed to set auto launch',
        // })
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
          selectedKeys={chatModel ? [chatModel] : []}
          onSelectionChange={(keys) => {
            if (keys instanceof Set) {
              const model = keys.values().next().value
              setChatModel(model)
              window.electronAPI.setUserConfigValue('selectedChatModel', model)
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
          isSelected={mockPaidRequests}
          onValueChange={(checked) => {
            setMockPaidRequests(checked)
            window.electronAPI.setUserConfigValue('mockPaidRequests', checked)
          }}
        >
          Mock paid requests
        </Checkbox>

        <Checkbox
          color="default"
          isSelected={launchOnStartup}
          onValueChange={toggleLaunchOnStartup}
        >
          Launch on startup
        </Checkbox>

        <Checkbox
          color="default"
          isSelected={launchHidden}
          onValueChange={(checked) => {
            setLaunchHidden(checked)
            window.electronAPI.setUserConfigValue('launchHidden', checked)
          }}
        >
          Launch hidden
        </Checkbox>

        <Checkbox
          color="default"
          isSelected={useHistory}
          onValueChange={(checked) => {
            setUseHistory(checked)
            window.electronAPI.setUserConfigValue('includeHistory', checked)
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
          value={maxHistoryLength.toString()}
          onChange={handleMaxHistoryLengthChange}
          label={
            <span className="text-nowrap">Previous messages sent to AI</span>
          }
        />
      </CardBody>
    </GlassCard>
  )
}
