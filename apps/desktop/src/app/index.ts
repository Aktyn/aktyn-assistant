import path from 'path'

import { app, BrowserWindow, shell } from 'electron'

const createWindow = () => {
  const publicPath = path.join(__dirname, '..', 'public')

  const openDevTools = true

  const win = new BrowserWindow({
    width: 1280,
    height: 640 + (openDevTools ? 450 : 0),
    autoHideMenuBar: true,
    title: 'Aktyn Assistant',
    icon: path.join(publicPath, 'img', 'icon.png'),
    backgroundColor: '#263238',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.loadFile(path.join(publicPath, 'index.html')).catch(console.error)
  if (openDevTools) {
    win.webContents.openDevTools()
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(console.error)
    return { action: 'deny' }
  })
}

app
  .whenReady()
  .then(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
  .catch(console.error)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
