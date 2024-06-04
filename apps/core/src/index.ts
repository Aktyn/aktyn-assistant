import { selectAiProvider, showWelcomeMessage } from '@aktyn-assistant/terminal-interface'

import { AiProvider, getAiClient } from './ai'
import { getUserConfigValue } from './utils/user-config'

showWelcomeMessage()

//TODO: no hoist packages like terminal-kit

async function run() {
  const aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider) {
    console.log(await selectAiProvider(Object.values(AiProvider)))
    return
  }
}

run().catch(console.error)

async function start(ai = getAiClient()) {
  ai.setMockPaidRequests(true)

  //TODO: option for selecting rectangular part of screen when performing operation requires screen capture
  const models = await ai.getAvailableModels()
  console.log(models.filter((name) => name.startsWith('gpt')).join(', '))

  const chatStream = await ai.performChatQuery('Say "Hello" and count to 10')

  //TODO: allow to abort stream
  // chatStream.controller.abort('Reason message')

  for await (const chunk of chatStream) {
    console.log(chunk)
  }

  //TODO: implement electron based user interface
}

// start().catch(notifyAiError)
