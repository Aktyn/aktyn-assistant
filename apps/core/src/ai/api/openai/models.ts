import { type OpenAI } from 'openai'

import { getOpenAiClient } from '.'

//istanbul ignore next
export async function getAvailableModels(client?: OpenAI) {
  client ??= await getOpenAiClient()
  const models: OpenAI.Models.Model[] = []

  const list = await client.models.list()
  for await (const model of list) {
    //TODO: support different model types (speech, image generation, etc.)
    if (model.id.startsWith('gpt')) {
      models.push(model)
    }
  }

  return models
}
