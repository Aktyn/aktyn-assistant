import type { OpenAI } from 'openai'

import { getOpenAiClient } from '.'

//istanbul ignore next
export async function performChatQuery(content: string, client?: OpenAI) {
  client ??= await getOpenAiClient()
  return await client.chat.completions.create({
    model: 'gpt-3.5-turbo', //TODO: allow user to select model (in a cli-style at first)
    messages: [{ role: 'user', content }],
    stream: true,
  })
}
