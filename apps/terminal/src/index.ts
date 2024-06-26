import {
  AI,
  AiProviderType,
  getUserConfigValue,
  setUserConfigValue,
} from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { toggleTerminateOnCtrlC } from './common'
import { printError } from './error'
import { requestApiKey } from './input'
import { TerminalInterface } from './interface/terminalInterface'
import { showSpinner } from './loading'
import { selectOption, selectYesOrNo } from './select'
import { showWelcomeMessage } from './welcome'

//TODO: option for selecting rectangular part of screen when performing operation requires screen capture

async function run() {
  terminal.reset()
  terminal.clear()
  toggleTerminateOnCtrlC(true)
  showWelcomeMessage()

  let aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider || !Object.values(AiProviderType).includes(aiProvider)) {
    aiProvider = (await selectOption(
      Object.values(AiProviderType),
      'Select AI provider you want to use:',
    )) as AiProviderType
    setUserConfigValue('selectedAiProvider', aiProvider)
    console.info(`Selected ${aiProvider} as your AI provider`)
  }

  try {
    const ai = await AI.client({
      providerType: aiProvider,
      requestApiKey: async (providerType, reason) => {
        if (reason === 'validation-failed') {
          printError({
            title: "Provided API key didn't work",
            message: 'Please try again or press CTRL+C to exit',
          })
        }
        return await requestApiKey(providerType)
      },
    })

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
      mockPaidRequests = await selectYesOrNo(
        'Do you want to mock paid requests to AI provider?',
      )
      setUserConfigValue('mockPaidRequests', mockPaidRequests)
    }
    if (mockPaidRequests) {
      console.info(`Paid requests to AI provider are mocked`)
    }

    console.info(
      "Initial setup doesn't require any further work. Initializing menu interface...",
    )

    const terminalInterface = new TerminalInterface(ai)

    terminalInterface.showInterface()
  } catch (error) {
    AI.notifyError(error, 'Setup error')
    console.error(error)
    process.exit(1)
  }
}

run().catch(console.error)
