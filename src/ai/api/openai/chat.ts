import { getOpenAiClient } from '.'

export async function performChatQuery(client = getOpenAiClient()) {
  const completionsStream = await client.chat.completions.create({
    model: 'gpt-3.5-turbo', //TODO: allow user to select model (in a cli-style at first)
    messages: [{ role: 'user', content: 'Say this is a test' }], // and count to 10
    stream: true,
  })
  //TODO: allow to cancel stream
  for await (const chunk of completionsStream) {
    console.log(chunk.choices[0]?.delta?.content || '', Date.now())
  }
  //TODO: develop from here
}
