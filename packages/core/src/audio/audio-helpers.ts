import fs from 'fs'
import path from 'path'

import { once } from '@aktyn-assistant/common'

import { getDataDirectory, logger } from '../utils'

export const getAudioOutputDirectory = once(() => {
  const audioDir = path.join(getDataDirectory(), 'audio')
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true })
  }
  return audioDir
})

export function removeOutdatedAudioFiles(lifetime = 1000 * 60 * 60) {
  try {
    const audioDir = getAudioOutputDirectory()

    const now = Date.now()
    for (const file of fs.readdirSync(audioDir)) {
      const filePath = path.join(audioDir, file)
      if (now - fs.statSync(filePath).mtime.getTime() > lifetime) {
        fs.unlinkSync(filePath)
      }
    }
  } catch (error) {
    logger.error(error)
  }
}
