import fs from 'fs'
import path from 'path'

import { getConfigDirectory } from '../../user-config'

const getKeyFilePath = (fileName: string) => path.join(getConfigDirectory(), fileName)

export function loadProviderApiKey(fileName: string) {
  return loadApiKey(getKeyFilePath(fileName))
}

export function saveProviderApiKey(fileName: string, apiKey: string) {
  const keyFilePath = getKeyFilePath(fileName)

  if (!fs.existsSync(path.dirname(keyFilePath))) {
    fs.mkdirSync(path.dirname(keyFilePath), { recursive: true })
  }
  fs.writeFileSync(keyFilePath, apiKey, 'utf8')
}

export function removeProviderApiKey(fileName: string) {
  const keyFilePath = getKeyFilePath(fileName)
  if (fs.existsSync(keyFilePath)) {
    fs.unlinkSync(keyFilePath)
  }
}

function loadApiKey(path: string) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch {
    return null
  }
}
