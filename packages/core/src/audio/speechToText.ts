import { logger } from '../utils'

import { Whisper } from './whisper'

/** Returns null if whisper is not supported on the current platform */
export function initWhisper() {
  return Whisper.instance().downloadModel()
}

/** filePath must point to a 16kHz mono channel .wav file */
export async function speechToText(filePath: string) {
  const whisper = Whisper.instance()
  if (!whisper.isReady()) {
    throw new Error('Whisper model is not yet ready')
  }

  logger.info(`Transcribing audio: ${filePath}`)
  return await whisper.transcribe(filePath).then(parseWhisperOutput)
}

function parseWhisperOutput(output: string) {
  return output
    .split('\n')
    .map((line) => line.replace(/^\[.+\s-->\s.+\]/g, '').trim())
    .filter(Boolean)
    .join(' ')
}
