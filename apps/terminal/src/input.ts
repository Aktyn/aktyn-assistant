import type { AiProviderType } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

export async function requestApiKey(aiProviderType: AiProviderType) {
  terminal.bold(`Please enter your ${aiProviderType} API key:\n`)
  const { promise } = terminal.inputField({ cancelable: false })

  const input = await promise
  terminal.eraseLineAfter()

  if (!input) {
    return requestApiKey(aiProviderType)
  }

  return input
}
