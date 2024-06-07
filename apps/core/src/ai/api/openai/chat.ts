import type { OpenAI } from 'openai'

import { getOpenAiClient } from '.'

//istanbul ignore next
export async function performChatQuery(content: string, model: string, client?: OpenAI) {
  client ??= await getOpenAiClient()
  return await client.chat.completions.create({
    model,
    /** NOTE: this should contain conversation history in order for AI to remember previous responses */
    messages: [{ role: 'user', content }],
    // tools // TODO: implement
    stream: true,
  })
}
