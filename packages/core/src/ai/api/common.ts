import fs from 'fs'
import path from 'path'

import { getConfigDirectory } from '../../user/user-config'

export enum AiProviderType {
  openai = 'OpenAI',
}

const AiProviderApiKeyFileNames: { [key in AiProviderType]: string } = {
  [AiProviderType.openai]: 'openai-key.json',
}

const getKeyFilePath = (providerType: AiProviderType) =>
  path.join(getConfigDirectory(), AiProviderApiKeyFileNames[providerType])

export function loadProviderApiKey(providerType: AiProviderType) {
  return loadApiKey(getKeyFilePath(providerType))
}

export function saveProviderApiKey(
  providerType: AiProviderType,
  apiKey: string,
) {
  const keyFilePath = getKeyFilePath(providerType)

  if (!fs.existsSync(path.dirname(keyFilePath))) {
    fs.mkdirSync(path.dirname(keyFilePath), { recursive: true })
  }
  fs.writeFileSync(keyFilePath, apiKey, 'utf8')
}

function loadApiKey(path: string) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch {
    return null
  }
}
