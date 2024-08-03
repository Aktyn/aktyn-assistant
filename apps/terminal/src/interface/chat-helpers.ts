import type { ChatResponse, Stream } from '@aktyn-assistant/common'
import { terminal } from 'terminal-kit'

import { printError } from '../error'

import { addNewLine } from './common'

export async function handleStreamedChatResponse(
  stream: Stream<ChatResponse>,
  listeners: { onStart: () => void },
) {
  let first = true
  for await (const chunk of stream) {
    if (stream.controller.signal.aborted) {
      break
    }

    if (first) {
      listeners.onStart()
      terminal.moveTo(1, terminal.height - 1).eraseLine()
      terminal.moveTo(1, terminal.height - 2).eraseLine()
      terminal.grey
        .bold('Chat response:')
        .grey(`\t(${new Date().toLocaleTimeString()})\t`)
        .yellow.bold('Press ESC to return to menu\n')
      first = false
    }

    terminal.color(getRoleColor(chunk.role), chunk.content)

    if (chunk.finished) {
      terminal.brightGreen.bold('\nResponse completed ✓')
    }
  }
}

export function handleChatResponseTimeout(stream: Stream<ChatResponse> | null) {
  if (stream && stream.controller.signal.reason === 'Timeout') {
    terminal.moveTo(1, terminal.height - 1).eraseLine()
    printError({
      title: 'Chat response timeout',
      message: 'Chat response took too long to complete. Please try again.',
    })

    for (let i = 0; i < 2; i++) {
      addNewLine()
    }
    return true
  }
  return false
}

function getRoleColor(role: ChatResponse['role']) {
  switch (role) {
    case 'system':
      return 'brightYellow'
    case 'user':
      return 'brightGreen'
    case 'assistant':
      return 'brightCyan'
    case 'tool':
      return 'brightMagenta'
    default:
      return 'default'
  }
}
