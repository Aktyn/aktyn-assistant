import { getAiClient, notifyAiError } from './ai'
//
;(async (ai = getAiClient()) => {
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
})().catch(notifyAiError)
