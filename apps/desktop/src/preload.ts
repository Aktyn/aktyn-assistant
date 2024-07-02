import type { ChatMessage, ChatResponse } from '@aktyn-assistant/common'
import type { AiProviderType, ToolData } from '@aktyn-assistant/core'
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
  getInitData: () => ipcRenderer.invoke('getInitData'),
  setAutoLaunch: (on: boolean) => ipcRenderer.invoke('setAutoLaunch', on),
  getUserConfigValue: (key: string) =>
    ipcRenderer.invoke('getUserConfigValue', key),
  setUserConfigValue: (key: string, value: unknown) =>
    ipcRenderer.send('setUserConfigValue', key, value),
  getAvailableModels: () => ipcRenderer.invoke('getAvailableModels'),
  promptAiProviderCallback: (provider: AiProviderType) =>
    ipcRenderer.send('promptAiProviderCallback', provider),
  promptApiKeyCallback: (key: string) =>
    ipcRenderer.send('promptApiKeyCallback', key),
  performChatQuery: (message: ChatMessage, model: string, messageId: string) =>
    ipcRenderer.send('performChatQuery', message, model, messageId),
  addTool: (data: ToolData) => ipcRenderer.invoke('addTool', data),

  // Main to renderer
  onReady: (callback: () => void) =>
    ipcRenderer.on('ready', (_event) => callback()),
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
})
