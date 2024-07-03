import fs from 'fs'
import path from 'path'

import { isDev } from '@aktyn-assistant/common'
import {
  AI,
  AiProviderType,
  getUserConfigValue,
  setUserConfigValue,
} from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'

import { setupAutoLaunch } from './autoLaunch'
import {
  setupAiHandlers,
  setupToolHandlers,
  setupUserConfigHandlers,
} from './handlers'
import { forceSingleInstance } from './lock'
import { createChatWindow, createMainWindow, setupTray } from './window'

if (!isDev()) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { updateElectronApp } = require('update-electron-app')
  updateElectronApp()
}

function handleFatalError(error: unknown) {
  console.error(error)
  process.exit(1)
}

if (forceSingleInstance()) {
  app
    .whenReady()
    .then(() => {
      init().catch(handleFatalError)

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          init().catch(handleFatalError)
        }
      })
    })
    .catch(console.error)
} else {
  app.exit(0)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function init() {
  const autoLaunchUserConfig = getUserConfigValue('autoLaunch')

  const success = await setupAutoLaunch(
    !isDev() && (autoLaunchUserConfig ?? true),
  )
  if (success && !isDev()) {
    console.info('Auto launch enabled')
  }

  let ready = false
  ipcMain.handle('isReady', () => Promise.resolve(ready))
  ipcMain.handle('getInitData', () => {
    let version: string | undefined
    try {
      let packageJsonPath = path.join(__dirname, '..', 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
      }
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        version = packageJson.version
      }
    } catch (error) {
      console.error(error)
    }

    return Promise.resolve({
      autoLaunchEnabled: success,
      version,
    })
  })
  ipcMain.handle('setAutoLaunch', async (_, on: boolean) => {
    setUserConfigValue('autoLaunch', on)
    return await setupAutoLaunch(on)
  })

  setupUserConfigHandlers()
  setupToolHandlers()

  const win = await createMainWindow()

  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  let aiProvider = getUserConfigValue('selectedAiProvider')
  if (!aiProvider || !Object.values(AiProviderType).includes(aiProvider)) {
    win.show()
    win.webContents.send('promptForAiProvider', Object.values(AiProviderType))
    aiProvider = await new Promise<AiProviderType>((resolve) => {
      ipcMain.once('promptAiProviderCallback', (_, provider: AiProviderType) =>
        resolve(provider),
      )
    })
    setUserConfigValue('selectedAiProvider', aiProvider)
    console.info(`Selected ${aiProvider} as your AI provider`)
  }

  const ai = await AI.client({
    providerType: aiProvider,
    requestApiKey: async (providerType, reason) => {
      if (reason === 'validation-failed') {
        win.show()
        win.webContents.send(
          'showError',
          "Provided API key didn't work",
          'Please try again',
        )
      }

      win.show()
      win.webContents.send('promptForApiKey', providerType)
      return await new Promise<string>((resolve) => {
        ipcMain.once('promptApiKeyCallback', (_, key: string) => resolve(key))
      })
    },
  })

  setupAiHandlers(ai)

  ready = true
  win.webContents.send('ready')

  await postInit(win)
}

async function postInit(mainWindow: BrowserWindow) {
  let shown = false
  const quickChatWindow = await createChatWindow()

  quickChatWindow.on('close', (event) => {
    event.preventDefault()
    quickChatWindow?.hide()
  })

  const toggleQuickChat = async () => {
    if (shown) {
      quickChatWindow.hide()
      shown = false
    } else {
      quickChatWindow.show()
      shown = true
    }
  }

  globalShortcut.register('Alt+Q', async () => {
    toggleQuickChat().catch(console.error)
  })

  setupTray(mainWindow, toggleQuickChat)
}
