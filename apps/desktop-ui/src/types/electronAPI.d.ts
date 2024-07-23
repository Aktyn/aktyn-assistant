import type { ChatMessage, ChatResponse } from '@aktyn-assistant/common'
import type {
  AiProviderType,
  ChatSource,
  ToolInfo,
  ToolsSourceData,
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
      getAvailableModels: PromisyfyFunction<
        () => Record<'chatModels' | 'imageModels', string[]>
      >
      promptAiProviderCallback: (provider: AiProviderType) => void
      promptApiKeyCallback: (key: string) => void
      performChatQuery: (
        message: ChatMessage,
        model: string,
        messageId: string,
        source: ChatSource,
        ignoreHistory?: boolean,
      ) => void
      generateImage: (query: string, model: string) => Promise<string>
      addToolsSource: (data: ToolsSourceData) => Promise<string | null>
      loadToolsInfo: () => Promise<Array<ToolInfo>>
      setEnabledTools: (toolNames: string[]) => Promise<void>
      editTool: (updatedTool: ToolInfo) => Promise<void>
      removeTool: (toolName: string) => Promise<void>
      cancelSpeaking: () => void
      sendQuickCommand: (quickCommand: string) => void

      // Main to renderer
      onReady: (callback: () => void) => void
      onWhisperInitialized: (callback: (initialized: boolean) => void) => void
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
      onSpeakingState: (
        callback: (
          conversationId: string,
          messageId: string,
          finished: boolean,
        ) => void,
      ) => void
      onExternalCommand: (
        callback: (
          externalCommand: string,
          source: ChatSource,
          ignoreHistory?: boolean,
        ) => void,
      ) => void
    }
  }
}

export {}
