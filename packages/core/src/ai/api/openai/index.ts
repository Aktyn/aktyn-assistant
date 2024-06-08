import { OpenAI } from 'openai'

export * from './chat'
export * from './models'

async function validateClient(client: OpenAI) {
  await client.models.list()
}

export async function getOpenAiClient(apiKey: string) {
  const client = new OpenAI({ apiKey })
  await validateClient(client)
  return client
}
