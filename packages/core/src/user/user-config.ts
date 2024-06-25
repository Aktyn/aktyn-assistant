import fs from 'fs'
import path from 'path'

import { once } from '@aktyn-assistant/common'
import { getAppDataPath } from 'appdata-path'

import type { AiProviderType } from '../ai'

/**
 ** Do not export this object
 ** User should access it through `getUserConfigValue()` function
 * @see {@link getUserConfigValue}
 */
const USER_CONFIG = {
  selectedAiProvider: null as AiProviderType | null,
  selectedChatModel: null as string | null,
  mockPaidRequests: null as boolean | null,
  autoLaunch: false,
  launchHidden: false,
  showRawResponse: false,
  includeHistory: false,
  maxChatHistoryLength: 8,
}

export type UserConfigType = typeof USER_CONFIG

export const getConfigDirectory = once(() => getAppDataPath('aktyn-assistant'))

const getConfigPath = once(() => path.join(getConfigDirectory(), 'config.json'))

const lazyLoadConfig = once(() => {
  try {
    const data = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'))
    for (const key in USER_CONFIG) {
      if (key in data) {
        USER_CONFIG[key as keyof UserConfigType] = data[key] as never
      }
    }
  } catch {
    // noop
  }
})

export function getUserConfigValue<Key extends keyof UserConfigType>(
  key: Key,
): UserConfigType[Key] {
  lazyLoadConfig()

  return USER_CONFIG[key]
}

export function setUserConfigValue<Key extends keyof UserConfigType>(
  key: Key,
  value: UserConfigType[Key],
) {
  USER_CONFIG[key] = value
  const configPath = getConfigPath()
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
  }
  fs.writeFileSync(configPath, JSON.stringify(USER_CONFIG, null, 2), 'utf8')
}
