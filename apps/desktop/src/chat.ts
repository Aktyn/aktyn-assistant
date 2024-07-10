import type { ChatMessage } from '@aktyn-assistant/common'
import type { AI } from '@aktyn-assistant/core'
import type { WebContents } from 'electron'

export async function performChatQuery(
  ai: AI,
  webContents: WebContents,
  message: ChatMessage,
  model: string,
  messageId: string,
  ignoreHistory = false,
) {
  const stream = await ai.performChatQuery(message, {
    model,
    onSpeaking: (finished) => {
      webContents.send(
        'speakingState',
        message.conversationId,
        messageId,
        finished,
      )
    },
    ignoreHistory,
  })

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
    webContents.send('chatResponse', messageId, {
      finished: true,
      conversationId: message.conversationId,
    })
  }
}
