import { app } from 'electron'

export function forceSingleInstance() {
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    return false
  } else {
    return true
  }
}
