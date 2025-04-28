import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { toast } from 'sonner'
import { NotificationMessage } from '../components/common/NotificationMessage'
import { AiProviderSelectDialog } from '../components/dialog/AiProviderSelectDialog'
import { ApiKeyInputDialog } from '../components/dialog/ApiKeyInputDialog'
import { ModelsSelectDialog } from '../components/dialog/ModelsSelectDialog'
import type { ViewType } from '../utils/navigation'

type InitData = Awaited<ReturnType<typeof window.electronAPI.getInitData>>
const noop = () => {}

// eslint-disable-next-line react-refresh/only-export-components
export const GlobalContext = createContext({
  ready: false,
  initData: null as InitData | null,
  view: null as ViewType | null,
  setView: noop as (view: ViewType) => void,
  waitingForWhisper: false,
  whisperInitialized: false,
})

export const GlobalContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [ready, setReady] = useState(false)
  const [initData, setInitData] = useState<InitData | null>(null)
  const [view, setView] = useState<ViewType | null>(null)
  const [aiProviderDialogOpen, setAiProviderDialogOpen] = useState(false)
  const [aiProviders, setAiProviders] = useState<string[]>([])
  const [selectModelDialogOpen, setSelectModelDialogOpen] = useState(false)
  const [waitingForWhisper, setWaitingForWhisper] = useState(true)
  const [whisperInitialized, setWhisperInitialized] = useState(false)

  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [apiKeyProviderType, setApiKeyProviderType] = useState<string | null>(
    null,
  )

  const init = useCallback(async () => {
    setReady(true)

    const initData = await window.electronAPI.getInitData()
    setInitData(initData)

    const chatModel =
      await window.electronAPI.getUserConfigValue('selectedChatModel')
    const imageGenerationModel = await window.electronAPI.getUserConfigValue(
      'selectedImageGenerationModel',
    )
    if (!chatModel || !imageGenerationModel) {
      console.warn('Models not selected, requesting user for selection')
      setSelectModelDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    window.electronAPI.onError((title, message) => {
      toast.error(title, {
        description: (
          <NotificationMessage title={title} message={message} copyable />
        ),
        duration: Infinity,
        closeButton: true,
      })
    })

    window.electronAPI.onPromptForAiProvider((options: string[]) => {
      if (options.length === 1) {
        window.electronAPI.promptAiProviderCallback(options[0] as never)
        return
      }

      setAiProviders(options)
      setAiProviderDialogOpen(true)
    })

    window.electronAPI.onPromptForApiKey((providerType) => {
      setApiKeyDialogOpen(true)
      setApiKeyProviderType(providerType)
    })

    window.electronAPI.onWhisperInitialized((initialized) => {
      setWaitingForWhisper(false)
      setWhisperInitialized(initialized)
    })

    window.electronAPI
      .isReady()
      .then((ready) => {
        if (ready) {
          init().catch(console.error)
        } else {
          window.electronAPI.onReady(() => {
            init().catch(console.error)
          })
        }
      })
      .catch(console.error)
  }, [init])

  return (
    <GlobalContext.Provider
      value={{
        ready,
        initData,
        view,
        setView,
        waitingForWhisper,
        whisperInitialized,
      }}
    >
      {children}
      <AiProviderSelectDialog
        open={aiProviderDialogOpen}
        onClose={() => setAiProviderDialogOpen(false)}
        aiProviders={aiProviders}
      />
      {!aiProviderDialogOpen && apiKeyProviderType && (
        <ApiKeyInputDialog
          open={apiKeyDialogOpen}
          onClose={() => setApiKeyDialogOpen(false)}
          apiKeyProviderType={apiKeyProviderType}
        />
      )}
      {!aiProviderDialogOpen && !apiKeyDialogOpen && (
        <ModelsSelectDialog
          open={selectModelDialogOpen}
          onClose={() => setSelectModelDialogOpen(false)}
        />
      )}
    </GlobalContext.Provider>
  )
}
