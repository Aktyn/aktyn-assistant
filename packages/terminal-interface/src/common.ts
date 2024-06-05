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
