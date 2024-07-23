import {
  logger,
  type AI,
  type AudioRecorder,
  type ChatSource,
} from '@aktyn-assistant/core'
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
      logger.info('Recording voice command started')

      tray.setImage(getRecordingTrayIcon())
    } else {
      recording = false
      tray.setImage(getDefaultTrayIcon())
      logger.info('Recording voice command stopped. Processing...')

      const recordingFile = await recorder.end()
      const transcribedVoiceCommand = await ai.speechToText(recordingFile)
      logger.info(`Transcribed voice command: "${transcribedVoiceCommand}"`)

      if (transcribedVoiceCommand.trim().length > 1) {
        quickChatContents.send(
          'externalCommand',
          transcribedVoiceCommand,
          'voice-command' satisfies ChatSource,
        )
      }
    }
  })

  logger.info('Voice commands initialized')
}
