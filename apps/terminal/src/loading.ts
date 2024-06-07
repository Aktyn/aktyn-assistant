import { terminal } from 'terminal-kit'

export async function showSpinner(text: string) {
  try {
    const spinner = await terminal.spinner('dotSpinner')
    const loadingLine = terminal(` ${text}`)
    return {
      stop() {
        loadingLine.eraseLineBefore('\n')
        spinner.animate(false)
      },
    }
  } catch (error) {
    terminal.notify('Spinner error', error instanceof Error ? error.message : '---')
    return {
      stop() {},
    }
  }
}
