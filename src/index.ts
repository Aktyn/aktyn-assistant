import { getAiClient, notifyAiError } from './ai'
//
;(async (ai = getAiClient()) => {
  //TODO: option for selecting rectangular part of screen when performing operation requires screen capture
  const models = await ai.getAvailableModels()
  console.log(models.filter((name) => name.startsWith('gpt')).join(', '))

  await ai.performChatQuery()
})().catch(notifyAiError)
