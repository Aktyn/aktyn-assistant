import { selectAiProvider, showWelcomeMessage } from '@aktyn-assistant/terminal-interface'

import { AI, AiProvider } from './ai'
import { getUserConfigValue, setUserConfigValue } from './utils/user-config'

//TODO: no hoist packages like terminal-kit
//TODO: implement electron based user interface
//TODO: option for selecting rectangular part of screen when performing operation requires screen capture

showWelcomeMessage()

async function run() {
  let aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider) {
    try {
      aiProvider = (await selectAiProvider(Object.values(AiProvider))) as AiProvider
      setUserConfigValue('selectedAiProvider', aiProvider)
      console.info(`Selected ${aiProvider} as your AI provider`)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }

  try {
    const ai = await AI.client(aiProvider)
    ai.setMockPaidRequests(true)

    // const models = await ai.getAvailableModels()
    // console.log(models.filter((name) => name.startsWith('gpt')).join(', '))
    //... do more stuff
  } catch (error) {
    AI.notifyError(error)
    process.exit(1)
  }

  process.exit(0)
}

run().catch(console.error)

// async function startAi(ai = getAiClient()) {
//   ai.setMockPaidRequests(true)

//   // await ai.initialize()

//   const chatStream = await ai.performChatQuery('Say "Hello" and count to 10 backwards')

//   //TODO: allow to abort stream
//   // chatStream.controller.abort('Reason message')

//   for await (const chunk of chatStream) {
//     console.log(chunk)
//   }
// }
