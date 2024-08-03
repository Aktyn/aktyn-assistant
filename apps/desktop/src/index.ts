import fs from 'fs'
import path from 'path'

import { isDev } from '@aktyn-assistant/common'
import {
  AI,
  AiProviderType,
  AudioRecorder,
  getUserConfigValue,
  initLogger,
  logger,
  setUserConfigValue,
  type ChatSource,
  initWhisper,
} from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'

import { setupAutoLaunch } from './autoLaunch'
import {
  setupAiHandlers,
  setupQuickCommandHandlers,
  setupToolHandlers,
  setupUserConfigHandlers,
} from './handlers'
import { forceSingleInstance } from './lock'
import { initVoiceCommands } from './voiceCommands'
import {
  createMainWindow,
  createQuickChatWindow,
  createQuickCommandWindow,
  setupTray,
} from './window'

initLogger('desktop')

if (!isDev()) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { updateElectronApp } = require('update-electron-app')
  updateElectronApp()
}

function handleFatalError(error: unknown) {
  logger.error(error)
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
    .catch(logger.error)
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
    logger.info('Auto launch enabled')
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
      logger.error(error)
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
    logger.info(`Selected ${aiProvider} as your AI provider`)
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
  const quickChatWindow = await createQuickChatWindow()
  quickChatWindow.on('close', (event) => {
    event.preventDefault()
    quickChatWindow?.hide()
  })
  const toggleQuickChat = async () => {
    if (quickChatWindow.isVisible()) {
      quickChatWindow.hide()
    } else {
      quickChatWindow.show()
    }
  }
  globalShortcut.register('Alt+Q', async () => {
    toggleQuickChat().catch(logger.error)
  })

  const quickCommandWindow = await createQuickCommandWindow()
  quickCommandWindow.on('close', (event) => {
    event.preventDefault()
    quickCommandWindow?.hide()
  })
  const toggleQuickCommand = async () => {
    if (quickCommandWindow.isVisible()) {
      quickCommandWindow.hide()
    } else {
      quickCommandWindow.show()
    }
  }
  globalShortcut.register('Alt+X', async () => {
    toggleQuickCommand().catch(logger.error)
  })
  setupQuickCommandHandlers((quickCommand) => {
    quickCommandWindow.hide()
    quickChatWindow.webContents.send(
      'externalCommand',
      quickCommand,
      'quick-command' satisfies ChatSource,
      true,
    )
  })

  const tray = setupTray(mainWindow, toggleQuickChat, toggleQuickCommand)

  initWhisper()
    .then((supported) => {
      if (!supported) {
        logger.warn('Whisper is not supported on this platform')
        mainWindow.webContents.send('whisper-initialized', false)
        AI.notifyError(
          new Error('Whisper is not supported on this platform'),
          'Whisper initialization error',
        )
        return
      }
      logger.info('Whisper initialized')
      mainWindow.webContents.send('whisper-initialized', true)

      initVoiceCommands(
        new AudioRecorder(),
        tray,
        quickChatWindow.webContents,
      ).catch(logger.error)
    })
    .catch((error) => {
      mainWindow.webContents.send('whisper-initialized', false)
      AI.notifyError(error, 'Whisper initialization error')
      logger.error(error, 'Whisper initialization error')
    })
}
