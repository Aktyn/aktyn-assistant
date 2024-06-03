import { type OpenAI } from 'openai'

import { getOpenAiClient } from '.'

export async function getAvailableModels(client = getOpenAiClient()) {
  const models: OpenAI.Models.Model[] = []

  const list = await client.models.list()
  for await (const model of list) {
    //??? what difference does it make for me?
    // if (model.owned_by === 'openai' || model.owned_by === 'openai-internal') {
    models.push(model)
    // }
  }

  return models
}
