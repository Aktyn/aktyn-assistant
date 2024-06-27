import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Dialog } from '../deprecated/components/common/dialog'
import { Notifications } from '../deprecated/components/common/notifications'
import { createElement } from '../deprecated/utils/dom'

type InitData = Awaited<ReturnType<typeof window.electronAPI.getInitData>>

export const GlobalContext = createContext({
  initData: null as InitData | null,
})

export const GlobalContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [initData, setInitData] = useState<InitData | null>(null)

  const init = useCallback(async () => {
    const initData = await window.electronAPI.getInitData()
    setInitData(initData)
    //TODO
    // const menu = new Menu({
    //   onViewEnter: () => {
    //     header.hide().catch(console.error)
    //   },
    //   onViewHide: () => {
    //     header.enter().catch(console.error)
    //   },
    // })
    // await menu.init(initData)
  }, [])

  useEffect(() => {
    window.electronAPI.onError((title, message) => {
      //TODO
      Notifications.provider.showNotification(Notifications.type.Error, {
        title,
        message,
      })
    })

    window.electronAPI.onPromptForAiProvider((options: string[]) => {
      if (options.length === 1) {
        window.electronAPI.promptAiProviderCallback(options[0] as never)
        return
      }

      let selectedOption: string | null = null

      const optionButtons = options.map((option) =>
        createElement('button', {
          content: option,
          postProcess: (item) => {
            item.onclick = () => {
              selectedOption = option

              for (const button of optionButtons) {
                button.classList.remove('selected')
              }
              item.classList.add('selected')

              dialog.enableConfirmButton()
            }
          },
        }),
      )

      const dialog = new Dialog(
        'Select AI provider',
        createElement('div', {
          className: 'button-select-grid',
          content: optionButtons,
          style: {
            padding: '1rem',
          },
        }),
        {
          onClose: null,
          onConfirm: () => {
            if (!selectedOption) {
              return
            }
            window.electronAPI.promptAiProviderCallback(selectedOption as never)
            dialog.close()
          },
        },
      )
      dialog.disableConfirmButton()
      dialog.open()
    })

    window.electronAPI.onPromptForApiKey((providerType) => {
      let apiKeyValue = ''

      const keyInput = createElement('input', {
        postProcess: (input) => {
          input.autofocus = true

          input.onkeyup = (event) => {
            apiKeyValue = (event.target as HTMLInputElement).value.trim()
            if (apiKeyValue) {
              dialog.enableConfirmButton()
            } else {
              dialog.disableConfirmButton()
            }

            if (event.key === 'Enter' && apiKeyValue) {
              window.electronAPI.promptApiKeyCallback(apiKeyValue)
              dialog.close()
            }
          }
        },
      })

      //TODO
      const dialog = new Dialog(
        `Enter API key for ${providerType}`,
        createElement('div', {
          content: keyInput,
          style: {
            padding: '1rem',
            textAlign: 'center',
          },
        }),
        {
          onClose: null,
          onConfirm: () => {
            if (!apiKeyValue) {
              return
            }
            window.electronAPI.promptApiKeyCallback(apiKeyValue)
            dialog.close()
          },
        },
      )
      dialog.disableConfirmButton()
      dialog.open()
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
  }, [])

  return (
    <GlobalContext.Provider value={{ initData }}>
      {children}
    </GlobalContext.Provider>
  )
}
