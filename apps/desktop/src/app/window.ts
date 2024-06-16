import path from 'path'

import { BrowserWindow, shell } from 'electron'

export async function createWindow() {
  const publicPath = path.join(__dirname, '..', 'public')

  const openDevTools = false

  const win = new BrowserWindow({
    width: 1080,
    height: 640 + (openDevTools ? 450 : 0),
    autoHideMenuBar: true,
    title: 'Aktyn Assistant',
    icon: path.join(publicPath, 'img', 'icon.png'),
    backgroundColor: '#263238',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (openDevTools) {
    win.webContents.openDevTools()
  }
  await win.loadFile(path.join(publicPath, 'index.html'))

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(console.error)
    return { action: 'deny' }
  })

  return win
}
