import {
  AI,
  AiProviderType,
  getUserConfigValue,
  setUserConfigValue,
  type UserConfigType,
} from '@aktyn-assistant/core'
import { BrowserWindow, app, ipcMain, type IpcMainEvent } from 'electron'

import { performChatQuery } from './chat'
import { createWindow } from './window'

function handleFatalError(error: unknown) {
  console.error(error)
  process.exit(1)
}

app
  .whenReady()
  .then(() => {
    main().catch(handleFatalError)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        main().catch(handleFatalError)
      }
    })
  })
  .catch(console.error)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function main() {
  let ready = false
  ipcMain.handle('isReady', () => Promise.resolve(ready))
  ipcMain.handle('getUserConfigValue', (_, key: keyof UserConfigType) => getUserConfigValue(key))
  ipcMain.on(
    'setUserConfigValue',
    <Key extends keyof UserConfigType>(_: IpcMainEvent, key: Key, value: UserConfigType[Key]) =>
      setUserConfigValue(key, value),
  )
  ipcMain.handle('getAvailableModels', () => ai.getAvailableModels())

  const win = await createWindow()

  let aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider || !Object.values(AiProviderType).includes(aiProvider)) {
    win.webContents.send('promptForAiProvider', Object.values(AiProviderType))
    aiProvider = await new Promise<AiProviderType>((resolve) => {
      ipcMain.once('promptAiProviderCallback', (_, provider: AiProviderType) => resolve(provider))
    })
    setUserConfigValue('selectedAiProvider', aiProvider)
    console.info(`Selected ${aiProvider} as your AI provider`)
  }

  const ai = await AI.client({
    providerType: aiProvider,
    requestApiKey: async (providerType, reason) => {
      if (reason === 'validation-failed') {
        win.webContents.send('showError', "Provided API key didn't work", 'Please try again')
      }

      win.webContents.send('promptForApiKey', providerType)
      return await new Promise<string>((resolve) => {
        ipcMain.once('promptApiKeyCallback', (_, key: string) => resolve(key))
      })
    },
  })

  ipcMain.on('performChatQuery', async (_, message: string, model: string, messageId: string) =>
    performChatQuery(ai, win, message, model, messageId).catch(console.error),
  )

  ready = true
  win.webContents.send('ready')
}
