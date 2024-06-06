import { terminal } from 'terminal-kit'

export function printError(error: { title: string; message?: string }) {
  terminal.bold.red.error(`\n${error.title}\n`)
  if (error.message) {
    terminal.red.error(`${error.message}\n`)
  }
}
