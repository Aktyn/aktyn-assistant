import fs from 'fs'
import path from 'path'

import { getDataDirectory, logger } from '../../utils'

export enum AiProviderType {
  OpenAI = 'OpenAI',
}

const AiProviderApiKeyFileNames: { [key in AiProviderType]: string } = {
  [AiProviderType.OpenAI]: 'openai-key.json',
}

const getKeyFilePath = (providerType: AiProviderType) =>
  path.join(getDataDirectory(), AiProviderApiKeyFileNames[providerType])

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

export function deleteApiKey(providerType: AiProviderType) {
  const keyFilePath = getKeyFilePath(providerType)
  try {
    fs.unlinkSync(keyFilePath)
  } catch (error) {
    logger.error(error)
  }
}
