import type { OpenAI } from 'openai'

import { ModelType } from '../common'

function isModelType(model: OpenAI.Models.Model, type: ModelType) {
  switch (type) {
    case ModelType.Chat:
      return model.id.startsWith('gpt') || model.id.match(/^o\d+.*/)
    case ModelType.Image:
      return model.id === 'gpt-image-1'
  }
}

//istanbul ignore next
export async function getAvailableModels<T extends ModelType>(
  client: OpenAI,
  ...types: T[]
): Promise<{ [key in T]: OpenAI.Models.Model[] }> {
  const models = types.reduce(
    (acc, type) => {
      acc[type] = []
      return acc
    },
    {} as { [key in T]: OpenAI.Models.Model[] },
  )

  const list = await client.models.list()
  for await (const model of list) {
    for (const type of types) {
      if (isModelType(model, type)) {
        models[type].push(model)
      }
    }
  }

  return models
}
