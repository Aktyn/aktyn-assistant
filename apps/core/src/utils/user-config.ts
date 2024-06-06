import fs from 'fs'
import path from 'path'

import type { UserConfigType } from '@aktyn-assistant/common'
import { getAppDataPath } from 'appdata-path'

import { once } from './common'

/**
 ** Do not export this object
 ** User should access it through `getUserConfigValue()` function
 * @see {@link getUserConfigValue}
 */
const USER_CONFIG: UserConfigType = {
  selectedAiProvider: null,
  selectedChatModel: null,
  mockPaidRequests: null,
}

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
