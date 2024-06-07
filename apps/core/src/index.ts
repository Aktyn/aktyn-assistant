import { AiProvider } from '@aktyn-assistant/common'
import {
  TerminalInterface,
  selectOption,
  selectYesOrNo,
  showSpinner,
  showWelcomeMessage,
  toggleTerminateOnCtrlC,
} from '@aktyn-assistant/terminal-interface'

import { AI } from './ai'
import { getInterfaceAPI } from './interfaceAPI'
import { wait } from './utils/common'
import { getUserConfigValue, setUserConfigValue } from './utils/user-config'

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

    let mockPaidRequests = getUserConfigValue('mockPaidRequests')
    if (mockPaidRequests === null) {
      mockPaidRequests = await selectYesOrNo('Do you want to mock paid requests to AI provider?')
      setUserConfigValue('mockPaidRequests', mockPaidRequests)
    }
    if (mockPaidRequests) {
      console.info(`Paid requests to AI provider are mocked`)
    }

    console.info("Initial setup doesn't require any further work. Initializing menu interface...")

    const terminalInterface = new TerminalInterface(getInterfaceAPI(ai))

    terminalInterface.showInterface()
    await wait(1 << 20) //TODO: remove
  } catch (error) {
    AI.notifyError(error, 'Setup error')
    console.error(error)
    process.exit(1)
  }
}

run().catch(console.error)
