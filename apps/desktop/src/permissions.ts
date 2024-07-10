import { platform } from 'os'

// eslint-disable-next-line import/no-extraneous-dependencies
import { systemPreferences } from 'electron'

//TODO: remove if microphone recording is handled natively in @aktyn-assistant/core
export async function askForMicrophoneAccess() {
  try {
    if (platform() !== 'darwin') {
      return true
    }

    const status = systemPreferences.getMediaAccessStatus('microphone')

    if (status === 'not-determined') {
      const success = await systemPreferences.askForMediaAccess('microphone')
      return success.valueOf()
    }

    return status === 'granted'
  } catch (error) {
    console.error(
      'Could not get microphone permission:',
      error instanceof Error ? error.message : String(error),
    )
  }
  return false
}
