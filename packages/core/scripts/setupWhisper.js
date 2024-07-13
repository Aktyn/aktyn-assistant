const { nodewhisper } = require('nodejs-whisper')
const path = require('path')

function speechToTextTest(filePath) {
  return nodewhisper(filePath, {
    modelName: 'base.en', //Downloaded models name
    autoDownloadModelName: 'base.en',
    verbose: true,
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
  })
}

speechToTextTest(path.join(__dirname, 'test1_16kHz.wav'))
  .then(console.log)
  .catch(console.error)
