import { type OpenAI } from 'openai'

//istanbul ignore next
export async function getAvailableModels(client: OpenAI) {
  const chatModels: OpenAI.Models.Model[] = []
  const imageModels: OpenAI.Models.Model[] = []

  const list = await client.models.list()
  for await (const model of list) {
    if (model.id.startsWith('gpt')) {
      chatModels.push(model)
    } else if (model.id.startsWith('dall-e')) {
      imageModels.push(model)
    }
  }

  return { chatModels, imageModels }
}
