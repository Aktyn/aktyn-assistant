import type { ChatMessage } from '@aktyn-assistant/common'
import {
  addToolsSource,
  type AI,
  type ChatSource,
  editTool,
  getUserConfigValue,
  loadToolsInfo,
  logger,
  removeTool,
  setEnabledTools,
  setUserConfigValue,
  type ToolInfo,
  type ToolsSourceData,
  type UserConfigType,
} from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcMain, type IpcMainEvent } from 'electron'

import { performChatQuery } from './chat'

export function setupUserConfigHandlers() {
  ipcMain.handle('getUserConfigValue', (_, key: keyof UserConfigType) =>
    getUserConfigValue(key),
  )
  ipcMain.on(
    'setUserConfigValue',
    <Key extends keyof UserConfigType>(
      _: IpcMainEvent,
      key: Key,
      value: UserConfigType[Key],
    ) => setUserConfigValue(key, value),
  )
}

export function setupAiHandlers(ai: AI) {
  ipcMain.handle('getAvailableModels', () => ai.getAvailableModels())

  ipcMain.on('cancelSpeaking', () => {
    ai.cancelSpeaking()
  })

  ipcMain.on(
    'performChatQuery',
    async (
      event,
      message: ChatMessage,
      model: string,
      messageId: string,
      source: ChatSource,
      ignoreHistory?: boolean,
    ) =>
      performChatQuery(
        ai,
        event.sender,
        message,
        model,
        messageId,
        source,
        ignoreHistory,
      ).catch((error) => {
        logger.error(error)
        ai.notifyError(error, 'Performing chat query error')
        event.sender.send('chatResponse', messageId, { finished: true })
      }),
  )
  ipcMain.handle('generateImage', async (_, query: string, model: string) =>
    ai.generateImage(query, { model }),
  )
}

export function setupToolHandlers() {
  ipcMain.handle('addToolsSource', (_, data: ToolsSourceData) => {
    try {
      addToolsSource(data)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Unknown error'
    }
  })
  ipcMain.handle('loadToolsInfo', () => loadToolsInfo())
  ipcMain.handle('setEnabledTools', (_, toolNames: string[]) =>
    setEnabledTools(toolNames),
  )
  ipcMain.handle('editTool', (_, updatedTool: ToolInfo) =>
    editTool(updatedTool),
  )
  ipcMain.handle('removeTool', (_, toolName: string) => removeTool(toolName))
}

export function setupQuickCommandHandlers(
  onQuickCommand: (quickCommand: string) => void,
) {
  ipcMain.on('sendQuickCommand', (_, quickCommand: string) => {
    onQuickCommand(quickCommand)
  })
}
