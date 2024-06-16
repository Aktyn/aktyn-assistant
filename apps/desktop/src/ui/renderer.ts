import { Menu, ViewType } from './circularMenu'
import { Dialog } from './components/dialog'
import { Notifications } from './components/notifications'
import { createElement } from './domUtils'
import { TitleHeader } from './titleHeader'

function generatePatternBackground() {
  const div = document.getElementById('pattern-bg')
  if (!div) {
    console.warn('Pattern background not found in DOM')
    return
  }

  div.innerText = Array.from({ length: 100 })
    .map((_) => 'I')
    .join('')
}

async function init() {
  window.electronAPI.onError((title, message) => {
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

  const header = new TitleHeader()

  await new Promise((resolve) => setTimeout(resolve, 1))

  generatePatternBackground()

  await new Promise((resolve) => setTimeout(resolve, 100))

  anime({
    targets: document.querySelector('#dim-bg'),
    easing: 'easeOutCubic',
    duration: 800,
    delay: 200,
    opacity: 0,
  })

  void header.enter() //TODO: restore await

  const isReady = await window.electronAPI.isReady()
  if (isReady) {
    await postInit(header)
  } else {
    window.electronAPI.onReady(() => {
      postInit(header).catch(console.error)
    })
  }
}

async function postInit(header: TitleHeader) {
  const menu = new Menu({
    onViewEnter: () => {
      header.hide().catch(console.error)
    },
    onViewHide: () => {
      header.enter().catch(console.error)
    },
  })
  void menu.init() //TODO: restore await

  menu.enterView(ViewType.Settings) //TODO: remove
}

init().catch(console.error)
