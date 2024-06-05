import fs from 'fs'
import path from 'path'

import { getAppDataPath } from 'appdata-path'

import type { AiProvider } from '../ai'

import { once } from './common'

/**
 ** Do not export this object
 ** User should access it through `getUserConfigValue()` function
 * @see {@link getUserConfigValue}
 */
const USER_CONFIG = {
  selectedAiProvider: null as AiProvider | null,
  selectedChatModel: null as string | null,
}

export const getConfigDirectory = once(() => getAppDataPath('aktyn-assistant'))

const getConfigPath = once(() => path.join(getConfigDirectory(), 'config.json'))

const lazyLoadConfig = once(() => {
  try {
    const data = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'))
    for (const key in USER_CONFIG) {
      if (key in data) {
        USER_CONFIG[key as keyof typeof USER_CONFIG] = data[key]
      }
    }
  } catch {
    // noop
  }
})

export function getUserConfigValue<Key extends keyof typeof USER_CONFIG>(
  key: Key,
): (typeof USER_CONFIG)[Key] {
  lazyLoadConfig()

  return USER_CONFIG[key]
}

export function setUserConfigValue<Key extends keyof typeof USER_CONFIG>(
  key: Key,
  value: (typeof USER_CONFIG)[Key],
) {
  USER_CONFIG[key] = value
  const configPath = getConfigPath()
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(USER_CONFIG, null, 2), 'utf8')
}
