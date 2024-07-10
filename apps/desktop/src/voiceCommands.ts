import type { AI, AudioRecorder } from '@aktyn-assistant/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { globalShortcut, type Tray, type WebContents } from 'electron'

import { getDefaultTrayIcon, getRecordingTrayIcon } from './window'

export async function initVoiceCommands(
  recorder: AudioRecorder,
  ai: AI,
  tray: Tray,
  quickChatContents: WebContents,
) {
  let recording = false

  globalShortcut.register('Alt+A', async () => {
    if (!recording) {
      recorder.start()
      recording = true
      console.info('Recording voice command started')

      tray.setImage(getRecordingTrayIcon())
    } else {
      recording = false
      tray.setImage(getDefaultTrayIcon())
      console.info('Recording voice command stopped. Processing...')

      const recordingFile = await recorder.end()
      const transcribedVoiceCommand = await ai.speechToText(recordingFile)
      console.info(`Transcribed voice command: "${transcribedVoiceCommand}"`)

      quickChatContents.send('externalCommand', transcribedVoiceCommand)
    }
  })
}
