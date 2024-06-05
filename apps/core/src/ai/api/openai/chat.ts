import type { OpenAI } from 'openai'

import { getOpenAiClient } from '.'

//istanbul ignore next
export async function performChatQuery(content: string, model: string, client?: OpenAI) {
  client ??= await getOpenAiClient()
  return await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
    stream: true,
  })
}
