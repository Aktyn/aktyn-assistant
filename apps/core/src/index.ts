import {
  selectOption,
  showSpinner,
  showWelcomeMessage,
  toggleTerminateOnCtrlC,
} from '@aktyn-assistant/terminal-interface'

import { AI, AiProvider } from './ai'
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

    //... do more real stuff instead of mocked behavior
    ai.setMockPaidRequests(true)
    //TODO: allow user to abort stream
    const chatStream = await ai.performChatQuery('Say "Hello" and count to 10 backwards', chatModel)
    for await (const chunk of chatStream) {
      console.log(chunk)
    }
  } catch (error) {
    AI.notifyError(error, 'Setup error')
    process.exit(1)
  }

  process.exit(0)
}

run().catch(console.error)
