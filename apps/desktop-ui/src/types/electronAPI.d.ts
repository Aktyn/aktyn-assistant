import type { ChatMessage, ChatResponse } from '@aktyn-assistant/common'
import type {
  AiProviderType,
  ToolData,
  UserConfigType,
} from '@aktyn-assistant/core'

type PromisyfyFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T> extends Promise<unknown>
  ? ReturnType<T>
  : Promise<ReturnType<T>>

declare global {
  interface Window {
    electronAPI: {
      // Renderer to main
      isReady: () => Promise<boolean>
      getInitData: () => Promise<{
        autoLaunchEnabled: boolean
        version?: string
      }>
      setAutoLaunch: (on: boolean) => Promise<boolean>
      getUserConfigValue: <Key extends keyof UserConfigType>(
        key: Key,
      ) => Promise<UserConfigType[Key]>
      setUserConfigValue: <Key extends keyof UserConfigType>(
        key: Key,
        value: UserConfigType[Key],
      ) => void
      getAvailableModels: PromisyfyFunction<() => Promise<string[]>>
      promptAiProviderCallback: (provider: AiProviderType) => void
      promptApiKeyCallback: (key: string) => void
      performChatQuery: (
        message: ChatMessage,
        model: string,
        messageId: string,
      ) => void
      addTool: (data: ToolData) => Promise<string | null>

      // Main to renderer
      onReady: (callback: () => void) => void
      onPromptForAiProvider: (callback: (options: string[]) => void) => void
      onPromptForApiKey: (
        callback: (providerType: AiProviderType) => void,
      ) => void
      onError: (callback: (title: string, message: string) => void) => void
      onChatResponse: (
        callback: (
          messageId: string,
          chunk: Partial<ChatResponse> &
            Required<Pick<ChatResponse, 'finished' | 'conversationId'>>,
        ) => void,
      ) => void
    }
    initMain: () => Promise<void>
    initQuickChat: () => Promise<void>
  }
}

export {}
