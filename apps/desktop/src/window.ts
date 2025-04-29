import path from 'path'

import { isDev, once } from '@aktyn-assistant/common'
import { getUserConfigValue, logger } from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  nativeImage,
  shell,
  type Rectangle,
} from 'electron'

const rootPath = path.join(__dirname, '..')
const uiPath = path.join(__dirname, '..', 'ui')
const iconPath = path.join(rootPath, 'img', 'icon.png')
const quickChatIconPath = path.join(rootPath, 'img', 'icon-quick-chat.png')
const trayIconPath = path.join(rootPath, 'img', 'icon-tray.png')
const recordingTrayIconPath = path.join(
  rootPath,
  'img',
  'icon-tray-recording.png',
)

const localhostUrl = 'http://localhost:5173'

export const getDefaultTrayIcon = once(() =>
  nativeImage.createFromPath(trayIconPath),
)
export const getRecordingTrayIcon = once(() =>
  nativeImage.createFromPath(recordingTrayIconPath),
)

const getStore = once(() =>
  import('electron-store').then(
    ({ default: Store }) =>
      new Store<{
        quickChatWindowBounds: Partial<Rectangle>
        quickCommandWindowBounds: Partial<Rectangle>
      }>(),
  ),
)

export async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720 + (isDev() ? 450 : 0),
    autoHideMenuBar: true,
    title: 'Aktyn Assistant',
    icon: iconPath,
    backgroundColor: '#000712',
    show: !getUserConfigValue('launchHidden'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  setupWindowToOpenLinksExternally(win)

  if (isDev()) {
    win.webContents.openDevTools()
    await win.loadURL(localhostUrl)
  } else {
    await win.loadFile(path.join(uiPath, 'index.html'))
  }

  return win
}

export async function createQuickChatWindow() {
  const store = await getStore()
  const bounds = store.get('quickChatWindowBounds')

  const win = new BrowserWindow({
    useContentSize: true,
    minWidth: 128,
    minHeight: 128,
    fullscreen: false,
    fullscreenable: false,
    maximizable: true,
    minimizable: false,
    hasShadow: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    icon: quickChatIconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    ...bounds,
  })
  setupWindowToOpenLinksExternally(win)

  if (isDev()) {
    await win.loadURL(`${localhostUrl}?mode=quick-chat`)
  } else {
    await win.loadFile(path.join(uiPath, 'index.html'), {
      search: 'mode=quick-chat',
    })
  }

  win.on('close', () => {
    store.set('quickChatWindowBounds', win.getBounds())
  })
  win.on('hide', () => {
    store.set('quickChatWindowBounds', win.getBounds())
  })

  return win
}

export async function createQuickCommandWindow() {
  const store = await getStore()
  const bounds = store.get('quickCommandWindowBounds')

  const win = new BrowserWindow({
    useContentSize: true,
    minWidth: 256,
    minHeight: 44,
    width: 256,
    height: 52,
    maxHeight: 52,
    fullscreen: false,
    fullscreenable: false,
    maximizable: true,
    minimizable: false,
    hasShadow: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    icon: quickChatIconPath,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    ...bounds,
  })
  setupWindowToOpenLinksExternally(win)

  await win.loadFile(path.join(rootPath, 'assets', 'quick-command.html'))

  win.on('close', () => {
    store.set('quickCommandWindowBounds', win.getBounds())
  })
  win.on('hide', () => {
    store.set('quickCommandWindowBounds', win.getBounds())
  })

  return win
}

function setupWindowToOpenLinksExternally(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(logger.error)
    return { action: 'deny' }
  })
}

export function setupTray(
  mainWindow: BrowserWindow,
  toggleQuickChat: () => Promise<void>,
  toggleQuickCommand: () => Promise<void>,
) {
  const toggleMainWindow = () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  }

  mainWindow.on('close', (event) => {
    event.preventDefault()
    toggleMainWindow()
  })

  const icon = getDefaultTrayIcon()

  const tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setIgnoreDoubleClickEvents(true)

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle main window',
      click: (_) => toggleMainWindow(),
    },
    {
      label: 'Toggle quick chat (Alt+Q)',
      click: (_) => toggleQuickChat().catch(logger.error),
    },
    {
      label: 'Toggle quick command (Alt+X)',
      click: (_) => toggleQuickCommand().catch(logger.error),
    },
    {
      label: 'Quit',
      click: (_) => app.exit(0),
    },
  ])
  tray.setContextMenu(trayMenu)

  tray.on('click', toggleMainWindow)

  return tray
}
