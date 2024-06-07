import { type ChatResponse } from '@aktyn-assistant/common'
import { terminal } from 'terminal-kit'

export function showEscapeToReturnToMenuInfo() {
  terminal.moveTo(1, terminal.height - 1)
  terminal.eraseLine().yellow.bold('Press ESC to return to menu')
}

export function addNewLine() {
  terminal.moveTo(1, terminal.height - 1).defaultColor('\n')
}

export function getRoleColor(role: ChatResponse['role']) {
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
