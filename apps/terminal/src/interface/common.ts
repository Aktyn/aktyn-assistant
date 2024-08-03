import { terminal } from 'terminal-kit'

export function showEscapeToReturnToMenuInfo(printInPlace = false) {
  if (!printInPlace) {
    terminal.moveTo(1, terminal.height - 1)
  }
  terminal.eraseLine().yellow.bold('Press ESC to return to menu')
}

export function addNewLine() {
  terminal.moveTo(1, terminal.height - 1).defaultColor('\n')
}

export function clearTerminal() {
  try {
    terminal.reset()
    terminal.clear().eraseDisplay().moveTo(1, 1)
    terminal.resetScrollingRegion()
    terminal.scrollingRegion(0, terminal.height - 1)
  } catch {
    //ignore
  }
}
