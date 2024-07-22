import { logger } from '@aktyn-assistant/core'
import AutoLaunch from 'auto-launch'

export async function setupAutoLaunch(enable: boolean) {
  try {
    const autoLauncher = new AutoLaunch({
      name: 'Aktyn Assistant',
    })
    const enabled = await autoLauncher.isEnabled()
    if (enabled === enable) {
      return true
    }
    if (enable) {
      logger.info('Enabling auto launch')
      await autoLauncher.enable()
    } else {
      logger.info('Disabling auto launch')
      await autoLauncher.disable()
    }

    return true
  } catch (error) {
    logger.error(error)
    return false
  }
}
