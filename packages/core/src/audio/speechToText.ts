import { exec } from 'child_process'
import { platform } from 'os'
import path from 'path' // Ensure the path module is imported

//@ts-expect-error resourcesPath comes from packaged electron
const basePath = process.resourcesPath ?? path.join(__dirname, '..', '..')

const whisperAssetsPath = path.join(basePath, 'assets', 'whisper')
const modelPath = path.join(whisperAssetsPath, 'models', 'ggml-base.en.bin')
//TODO: support for other platforms
const executablePath =
  platform() !== 'win32' ? path.join(whisperAssetsPath, 'linux', 'main') : null

/** filePath must point to a 16kHz mono channel .wav file */
export function speechToText(filePath: string, _isPackaged = false) {
  console.info('Transcribing audio:', filePath)

  if (!executablePath) {
    throw new Error(
      'Whisper executable not found. It is probably not supported on your platform',
    )
  }

  return new Promise<string>((resolve, reject) => {
    exec(
      `${executablePath} -ml 20 -sow true -l en -m ${modelPath} -f ${filePath}`,
      (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      },
    )
  }).then(parseWhisperOutput)
}

function parseWhisperOutput(output: string) {
  return output
    .split('\n')
    .map((line) => line.replace(/^\[.+\s-->\s.+\]/g, '').trim())
    .filter(Boolean)
    .join(' ')
}
