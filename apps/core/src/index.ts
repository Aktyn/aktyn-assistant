import {
  TerminalInterface,
  selectOption,
  showSpinner,
  showWelcomeMessage,
  toggleTerminateOnCtrlC,
} from '@aktyn-assistant/terminal-interface'

import { AI, AiProvider } from './ai'
import { wait } from './utils/common'
import { getUserConfigValue, setUserConfigValue } from './utils/user-config'

//TODO: no hoist packages like terminal-kit
//TODO: implement electron based user interface
//TODO: option for selecting rectangular part of screen when performing operation requires screen capture

async function run() {
  toggleTerminateOnCtrlC(true)
  showWelcomeMessage()

  let aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider) {
    aiProvider = (await selectOption(
      Object.values(AiProvider),
      'Select AI provider you want to use:',
    )) as AiProvider
    setUserConfigValue('selectedAiProvider', aiProvider)
    console.info(`Selected ${aiProvider} as your AI provider`)
  }

  try {
    const ai = await AI.client(aiProvider)

    let chatModel = getUserConfigValue('selectedChatModel')
    const spinner = await showSpinner('Loading available models...')
    const availableModels = await ai.getAvailableModels()
    spinner.stop()
    if (!chatModel || !availableModels.includes(chatModel)) {
      chatModel = await selectOption(
        availableModels.sort(),
        'Select model you want to use for chat:',
      )
      setUserConfigValue('selectedChatModel', chatModel)
      console.info(`Selected ${chatModel} as your AI chat model`)
    }

    ai.setMockPaidRequests(true) //TODO: allow to toggle this from settings interface

    const terminalInterface = new TerminalInterface({
      onChatMessage: async (message) => {
        try {
          return await ai.performChatQuery(message, chatModel)
        } catch (error) {
          AI.notifyError(error, 'Performing chat query error')
          throw error
        }
      },
    })
    terminalInterface.showInterface()
    await wait(1 << 20) //TODO: remove
  } catch (error) {
    AI.notifyError(error, 'Setup error')
    console.error(error)
    process.exit(1)
  }
}

run().catch(console.error)
