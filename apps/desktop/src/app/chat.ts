import type { AI } from '@aktyn-assistant/core'
import type { BrowserWindow } from 'electron'

export async function performChatQuery(
  ai: AI,
  win: BrowserWindow,
  message: string,
  model: string,
  messageId: string,
) {
  const stream = await ai.performChatQuery(message, model)

  for await (const chunk of stream) {
    if (stream.controller.signal.aborted) {
      break
    }

    win.webContents.send('chatResponse', messageId, chunk)
  }

  if (stream.controller.signal.aborted) {
    win.webContents.send('chatResponse', messageId, { finished: true })
  }
}
