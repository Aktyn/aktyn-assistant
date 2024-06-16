import type { ChatResponse } from '@aktyn-assistant/common'
import type { AiProviderType } from '@aktyn-assistant/core'
import { contextBridge, ipcRenderer } from 'electron'

window.addEventListener('DOMContentLoaded', () => {
  const keys = ['chrome', 'node', 'electron']
  const versions = Object.entries(process.versions).filter(([key]) => keys.includes(key))
  document.body.setAttribute('versions', JSON.stringify(Object.fromEntries(versions)))
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer to main
  isReady: () => ipcRenderer.invoke('isReady'),
  getUserConfigValue: (key: string) => ipcRenderer.invoke('getUserConfigValue', key),
  setUserConfigValue: (key: string, value: unknown) =>
    ipcRenderer.send('setUserConfigValue', key, value),
  getAvailableModels: () => ipcRenderer.invoke('getAvailableModels'),
  promptAiProviderCallback: (provider: AiProviderType) =>
    ipcRenderer.send('promptAiProviderCallback', provider),
  promptApiKeyCallback: (key: string) => ipcRenderer.send('promptApiKeyCallback', key),
  performChatQuery: (message: string, model: string, messageId: string) =>
    ipcRenderer.send('performChatQuery', message, model, messageId),

  // Main to renderer
  onReady: (callback: () => void) => ipcRenderer.on('ready', (_event) => callback()),
  onPromptForAiProvider: (callback: (options: string[]) => void) =>
    ipcRenderer.on('promptForAiProvider', (_, options: string[]) => callback(options)),
  onPromptForApiKey: (callback: (providerType: AiProviderType) => void) =>
    ipcRenderer.on('promptForApiKey', (_, providerType: AiProviderType) => callback(providerType)),
  onError: (callback: (title: string, message: string) => void) =>
    ipcRenderer.on('showError', (_, title: string, message: string) => callback(title, message)),
  onChatResponse: (
    callback: (messageId: string, chunk: ChatResponse | { finished: true }) => void,
  ) =>
    ipcRenderer.on(
      'chatResponse',
      (_, messageId: string, chunk: ChatResponse | { finished: true }) =>
        callback(messageId, chunk),
    ),
})
