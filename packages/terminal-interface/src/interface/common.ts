import { terminal } from 'terminal-kit'

export function showEscapeToReturnToMenuInfo() {
  terminal.moveTo(1, terminal.height - 1)
  terminal.eraseLine().yellow.bold('Press ESC to return to menu')
}

export function addNewLine() {
  terminal.moveTo(1, terminal.height - 1).defaultColor('\n')
}
