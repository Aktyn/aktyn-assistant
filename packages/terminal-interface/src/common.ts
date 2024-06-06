import { terminal } from 'terminal-kit'

function terminateOnCtrlC(key: string) {
  if (key === 'CTRL_C') {
    terminal.processExit(0)
  }
}

export function toggleTerminateOnCtrlC(enable: boolean) {
  if (enable) {
    terminal.on('key', terminateOnCtrlC)
  } else {
    terminal.off('key', terminateOnCtrlC)
  }
}

export function printCentered(text: string) {
  const lines = text.split('\n')
  const maxLineLength = Math.max(...lines.map((line) => line.length))
  const padding = Math.floor((terminal.width - maxLineLength) / 2)
  if (padding < 0) {
    return
  }
  for (const line of lines) {
    terminal.defaultColor(`${' '.repeat(padding)}${line}\n`)
  }
}
