import path from 'path'

import { isDev, once } from '@aktyn-assistant/common'
import { getUserConfigValue } from '@aktyn-assistant/core'
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

const publicPath = path.join(__dirname, '..', 'public')
const iconPath = path.join(publicPath, 'img', 'icon.png')
const quickChatIconPath = path.join(publicPath, 'img', 'icon-quick-chat.png')
const trayIconPath = path.join(publicPath, 'img', 'icon-tray.png')

const getStore = once(() =>
  import('electron-store').then(
    ({ default: Store }) =>
      new Store<{
        quickChatWindowBounds: Partial<Rectangle>
      }>(),
  ),
)

export async function createMainWindow() {
  const openDevTools = isDev()

  const win = new BrowserWindow({
    width: 1080,
    height: 640 + (openDevTools ? 450 : 0),
    autoHideMenuBar: true,
    title: 'Aktyn Assistant',
    icon: iconPath,
    backgroundColor: '#263238',
    show: !getUserConfigValue('launchHidden'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (openDevTools) {
    win.webContents.openDevTools()
  }
  await win.loadFile(path.join(publicPath, 'index.html'))

  setupWindowToOpenLinksExternally(win)

  return win
}

export async function createChatWindow() {
  const store = await getStore()
  const bounds = store.get('quickChatWindowBounds')

  const win = new BrowserWindow({
    useContentSize: true,
    minWidth: 128,
    height: 128,
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

  await win.loadFile(path.join(publicPath, 'quick-chat.html'))

  win.on('close', () => {
    store.set('quickChatWindowBounds', win.getBounds())
  })

  return win
}

function setupWindowToOpenLinksExternally(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(console.error)
    return { action: 'deny' }
  })
}

export function setupTray(
  mainWindow: BrowserWindow,
  toggleQuickChat: () => Promise<void>,
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

  const icon = nativeImage.createFromPath(trayIconPath)

  const tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setIgnoreDoubleClickEvents(true)

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle main window',
      click: (_) => toggleMainWindow(),
    },
    {
      label: 'Toggle quick chat (Alt+Q)',
      click: (_) => toggleQuickChat().catch(console.error),
    },
    {
      label: 'Quit',
      click: (_) => app.exit(0),
    },
  ])
  tray.setContextMenu(trayMenu)

  tray.on('click', toggleMainWindow)
}
