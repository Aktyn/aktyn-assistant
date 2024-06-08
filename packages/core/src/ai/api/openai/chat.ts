import type { OpenAI } from 'openai'

//istanbul ignore next
export async function performChatQuery(client: OpenAI, content: string, model: string) {
  return await client.chat.completions.create({
    model,
    /** NOTE: this should contain conversation history in order for AI to remember previous responses */
    messages: [{ role: 'user', content }],
    //TODO
    // tools: [
    //   {
    //     type: 'function',
    //     function: {
    //       function: getCurrentLocation,
    //       parameters: { type: 'object', properties: {} },
    //     },
    //   },
    //   {
    //     type: 'function',
    //     function: {
    //       function: getWeather,
    //       parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
    //       parameters: {
    //         type: 'object',
    //         properties: {
    //           location: { type: 'string' },
    //         },
    //       },
    //     },
    //   },
    // ],
    stream: true,
  })
}
