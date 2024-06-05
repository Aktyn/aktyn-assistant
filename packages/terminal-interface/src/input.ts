import { terminal } from 'terminal-kit'

export async function requestApiKey(aiProviderName: string) {
  terminal.bold(`Please enter your ${aiProviderName} API key:\n`)
  const { promise } = terminal.inputField({ cancelable: true })

  const input = await promise
  terminal.eraseLineAfter()

  return input
}
