import { once } from '@aktyn-assistant/common'
import { getAppDataPath } from 'appdata-path'

export const getDataDirectory = once(() => getAppDataPath('aktyn-assistant'))
