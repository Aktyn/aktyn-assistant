import type { ChatMessage, ChatResponse } from '@aktyn-assistant/common'
import type {
  AiProviderType,
  ChatSource,
  ModelType,
  ToolInfo,
  ToolsSourceData,
} from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge, ipcRenderer } from 'electron'

window.addEventListener('DOMContentLoaded', () => {
  const keys = ['chrome', 'node', 'electron']
  const versions = Object.entries(process.versions).filter(([key]) =>
    keys.includes(key),
  )
  document.body.setAttribute(
    'versions',
    JSON.stringify(Object.fromEntries(versions)),
  )
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer to main
  isReady: () => ipcRenderer.invoke('isReady'),
  isWaitingForWhisper: () => ipcRenderer.invoke('isWaitingForWhisper'),
  getInitData: () => ipcRenderer.invoke('getInitData'),
  setAutoLaunch: (on: boolean) => ipcRenderer.invoke('setAutoLaunch', on),
  getUserConfigValue: (key: string) =>
    ipcRenderer.invoke('getUserConfigValue', key),
  setUserConfigValue: (key: string, value: unknown) =>
    ipcRenderer.send('setUserConfigValue', key, value),
  getAvailableModels: <T extends ModelType>(...types: T[]) =>
    ipcRenderer.invoke('getAvailableModels', types),
  promptAiProviderCallback: (provider: AiProviderType) =>
    ipcRenderer.send('promptAiProviderCallback', provider),
  promptApiKeyCallback: (key: string) =>
    ipcRenderer.send('promptApiKeyCallback', key),
  performChatQuery: (
    message: ChatMessage,
    model: string,
    messageId: string,
    source: ChatSource,
    ignoreHistory?: boolean,
  ) =>
    ipcRenderer.send(
      'performChatQuery',
      message,
      model,
      messageId,
      source,
      ignoreHistory,
    ),
  generateImage: (query: string, model: string) =>
    ipcRenderer.invoke('generateImage', query, model),
  addToolsSource: (data: ToolsSourceData) =>
    ipcRenderer.invoke('addToolsSource', data),
  loadToolsInfo: () => ipcRenderer.invoke('loadToolsInfo'),
  setEnabledTools: (toolNames: string[]) =>
    ipcRenderer.invoke('setEnabledTools', toolNames),
  editTool: (updatedTool: ToolInfo) =>
    ipcRenderer.invoke('editTool', updatedTool),
  removeTool: (toolName: string) => ipcRenderer.invoke('removeTool', toolName),
  cancelSpeaking: () => ipcRenderer.send('cancelSpeaking'),
  sendQuickCommand: (quickCommand: string) =>
    ipcRenderer.send('sendQuickCommand', quickCommand),

  // Main to renderer
  onReady: (callback: () => void) =>
    ipcRenderer.on('ready', (_event) => callback()),
  onWhisperInitialized: (callback: (initialized: boolean) => void) =>
    ipcRenderer.on('whisper-initialized', (_event, initialized) =>
      callback(initialized),
    ),
  onPromptForAiProvider: (callback: (options: string[]) => void) =>
    ipcRenderer.on('promptForAiProvider', (_, options: string[]) =>
      callback(options),
    ),
  onPromptForApiKey: (callback: (providerType: AiProviderType) => void) =>
    ipcRenderer.on('promptForApiKey', (_, providerType: AiProviderType) =>
      callback(providerType),
    ),
  onError: (callback: (title: string, message: string) => void) =>
    ipcRenderer.on('showError', (_, title: string, message: string) =>
      callback(title, message),
    ),
  onChatResponse: (
    callback: (
      messageId: string,
      chunk: ChatResponse | { finished: true; conversationId: string },
    ) => void,
  ) =>
    ipcRenderer.on(
      'chatResponse',
      (
        _,
        messageId: string,
        chunk: ChatResponse | { finished: true; conversationId: string },
      ) => callback(messageId, chunk),
    ),
  onSpeakingState: (
    callback: (
      conversationId: string,
      messageId: string,
      finished: boolean,
    ) => void,
  ) =>
    ipcRenderer.on(
      'speakingState',
      (_, conversationId: string, messageId: string, finished: boolean) =>
        callback(conversationId, messageId, finished),
    ),
  onExternalCommand: (
    callback: (
      externalCommand: string,
      source: ChatSource,
      ignoreHistory?: boolean,
    ) => void,
  ) =>
    ipcRenderer.on(
      'externalCommand',
      (
        _,
        externalCommand: string,
        source: ChatSource,
        ignoreHistory?: boolean,
      ) => callback(externalCommand, source, ignoreHistory),
    ),
})
