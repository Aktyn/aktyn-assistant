import { getOpenAiClient } from '.'

//istanbul ignore next
export function performChatQuery(content: string, client = getOpenAiClient()) {
  return client.chat.completions.create({
    model: 'gpt-3.5-turbo', //TODO: allow user to select model (in a cli-style at first)
    messages: [{ role: 'user', content }],
    stream: true,
  })
}
