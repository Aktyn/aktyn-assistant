import { terminal } from 'terminal-kit'

export async function showSpinner(text: string) {
  const spinner = await terminal.spinner()
  const loadingLine = terminal(` ${text}`)
  return {
    stop() {
      loadingLine.eraseLineBefore('\n')
      spinner.animate(false)
    },
  }
}
