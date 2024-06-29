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
      console.info('Enabling auto launch')
      await autoLauncher.enable()
    } else {
      console.info('Disabling auto launch')
      await autoLauncher.disable()
    }

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
