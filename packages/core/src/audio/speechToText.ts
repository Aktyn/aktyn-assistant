import { nodewhisper } from 'nodejs-whisper'

/** filePath must point to a 16kHz mono channel .wav file */
export function speechToText(filePath: string) {
  console.info('Transcribing audio:', filePath)
  return nodewhisper(filePath, {
    modelName: 'base.en',
    // autoDownloadModelName: 'base.en', // (optional) auto download a model if model is not present
    verbose: false,
    removeWavFileAfterTranscription: false,
    withCuda: false,
    whisperOptions: {
      outputInText: false,
      outputInVtt: false,
      outputInSrt: false,
      outputInCsv: false,
      translateToEnglish: false,
      language: 'en',
      wordTimestamps: false,
      timestamps_length: 20,
      splitOnWord: true,
    },
  }).then((result) =>
    result
      .split('\n')
      .map((line) => line.replace(/^\[.+\s-->\s.+\]/g, '').trim())
      .filter(Boolean)
      .join(' '),
  )
}
