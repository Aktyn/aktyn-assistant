import type { AI } from '@aktyn-assistant/core'
import type { WebContents } from 'electron'

export async function performChatQuery(
  ai: AI,
  webContents: WebContents,
  message: string,
  model: string,
  messageId: string,
) {
  const stream = await ai.performChatQuery(message, model)

  let finished = false
  for await (const chunk of stream) {
    if (stream.controller.signal.aborted) {
      break
    }
    webContents.send('chatResponse', messageId, chunk)
    if (chunk.finished) {
      finished = true
    }
  }

  if (!finished) {
    webContents.send('chatResponse', messageId, { finished: true })
  }
}
