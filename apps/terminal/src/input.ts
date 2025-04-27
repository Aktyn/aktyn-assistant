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

export async function inputText(
  title: string,
  defaultValue?: string,
): Promise<string | null> {
  terminal.bold(`${title}: `)
  terminal.eraseLineAfter()

  const { promise } = terminal.inputField({
    default: defaultValue,
    cancelable: false,
    maxLength: 16777216,
  })

  const input = await promise
  return input ?? null
}

export async function inputNumber(
  title: string,
  min: number,
  max: number,
  defaultValue?: string,
): Promise<number | null> {
  terminal.bold(`${title}: `)
  terminal.eraseLineAfter()

  const { promise } = terminal.inputField({
    default: defaultValue,
    cancelable: false,
    maxLength: Math.max(1, max.toString().length),
    minLength: Math.max(1, min.toString().length),
  })

  const input = await promise
  const numberValue = parseInt(input ?? '', 10)
  if (isNaN(numberValue) || numberValue < min || numberValue > max) {
    return null
  }

  return numberValue
}
