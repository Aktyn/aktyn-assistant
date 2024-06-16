import type { AiProviderType, UserConfigType } from '@aktyn-assistant/core'

type PromisyfyFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T> extends Promise<unknown> ? ReturnType<T> : Promise<ReturnType<T>>

declare global {
  interface Window {
    electronAPI: {
      // Renderer to main
      isReady: () => Promise<boolean>
      getUserConfigValue: <Key extends keyof UserConfigType>(
        key: Key,
      ) => Promise<UserConfigType[Key]>
      setUserConfigValue: <Key extends keyof UserConfigType>(
        key: Key,
        value: UserConfigType[Key],
      ) => Promise<void>
      getAvailableModels: PromisyfyFunction<() => Promise<string[]>>
      promptAiProviderCallback: (provider: AiProviderType) => void
      promptApiKeyCallback: (key: string) => void

      // Main to renderer
      onReady: (callback: () => void) => void
      onPromptForAiProvider: (callback: (options: string[]) => void) => void
      onPromptForApiKey: (callback: (providerType: AiProviderType) => void) => void
      onError: (callback: (title: string, message: string) => void) => void
    }
  }
}

export {}
