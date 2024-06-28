import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Input } from '@nextui-org/input'
import { Listbox, ListboxItem } from '@nextui-org/listbox'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
import { NotificationMessage } from '../components/common/NotificationMessage'
import { Dialog } from '../components/dialog/Dialog'
import type { ViewType } from '../utils/navigation'

type InitData = Awaited<ReturnType<typeof window.electronAPI.getInitData>>
const noop = () => {}

export const GlobalContext = createContext({
  initData: null as InitData | null,
  view: null as ViewType | null,
  setView: noop as (view: ViewType) => void,
})

export const GlobalContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [initData, setInitData] = useState<InitData | null>(null)
  const [view, setView] = useState<ViewType | null>(null)
  const [aiProviderDialogOpen, setAiProviderDialogOpen] = useState(false)
  const [aiProviders, setAiProviders] = useState<string[]>([])
  const [selectedAiProvider, setSelectedAiProvider] = useState<string | null>(
    null,
  )
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [apiKeyProviderType, setApiKeyProviderType] = useState<string | null>(
    null,
  )
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null)

  const init = useCallback(async () => {
    const initData = await window.electronAPI.getInitData()
    setInitData(initData)
  }, [])

  useEffect(() => {
    window.electronAPI.onError((title, message) => {
      const key = enqueueSnackbar({
        variant: 'error',
        message: (
          <NotificationMessage
            title={title}
            message={message}
            copyable
            onClose={() => closeSnackbar(key)}
          />
        ),
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
    <GlobalContext.Provider value={{ initData, view, setView }}>
      {children}
      <Dialog
        isOpen={aiProviderDialogOpen}
        isDismissable={false}
        isKeyboardDismissDisabled
        title="Select AI provider"
        disableConfirmButton={!selectedAiProvider}
        onConfirm={() => {
          if (!selectedAiProvider) {
            return
          }
          window.electronAPI.promptAiProviderCallback(
            selectedAiProvider as never,
          )
          setAiProviderDialogOpen(false)
        }}
      >
        <Listbox
          aria-label="Single selection example"
          variant="flat"
          color="primary"
          disallowEmptySelection
          selectionMode="single"
          selectedKeys={selectedAiProvider ? [selectedAiProvider] : []}
          onSelectionChange={(selection) =>
            selection !== 'all' &&
            setSelectedAiProvider(selection.values().next().value)
          }
        >
          {aiProviders.map((provider) => (
            <ListboxItem key={provider} value={provider}>
              {provider}
            </ListboxItem>
          ))}
        </Listbox>
      </Dialog>
      <Dialog
        isOpen={apiKeyDialogOpen}
        isDismissable={false}
        isKeyboardDismissDisabled
        title={`Enter API key for ${apiKeyProviderType}`}
        disableConfirmButton={!apiKeyValue}
        onConfirm={() => {
          if (!apiKeyValue) {
            return
          }
          window.electronAPI.promptApiKeyCallback(apiKeyValue)
          setApiKeyDialogOpen(false)
        }}
      >
        <Input
          size="lg"
          variant="bordered"
          label="API key"
          isRequired
          value={apiKeyValue ?? ''}
          onChange={(value) => setApiKeyValue(value.target.value)}
        />
      </Dialog>
    </GlobalContext.Provider>
  )
}
