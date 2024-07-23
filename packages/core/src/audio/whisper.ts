import { exec, type ExecException } from 'child_process'
import fs from 'fs'
import { platform } from 'os'
import path from 'path'

import { getDataDirectory, logger } from '../utils'

const huggingFaceUrl = 'https://huggingface.co/ggerganov/whisper.cpp'
const modelFileName = 'ggml-base.en.bin'

//@ts-expect-error resourcesPath comes from packaged electron
const basePath = process.resourcesPath ?? path.join(__dirname, '..', '..')

const whisperAssetsPath = path.join(basePath, 'assets', 'whisper')
//TODO: support for other platforms
const executablePath =
  platform() !== 'win32' ? path.join(whisperAssetsPath, 'linux', 'main') : null

export class Whisper {
  private static _instance: Whisper | null = null

  private constructor() {}

  public static instance() {
    if (Whisper._instance) {
      return Whisper._instance
    }

    Whisper._instance = new Whisper()
    return Whisper._instance
  }

  private static readonly destinationPath = path.join(
    getDataDirectory(),
    modelFileName,
  )
  private static readonly sourceURL = `${huggingFaceUrl}/resolve/main/${modelFileName}`

  private ready = false
  private downloading = false

  public isReady() {
    return this.ready
  }

  public async downloadModel() {
    if (this.downloading) {
      throw new Error('Downloading model is already in progress')
    }

    if (this.isReady()) {
      return true
    }

    if (!executablePath) {
      logger.warn(
        'Whisper executable not found. It is probably not supported on your platform',
      )
      return false
    }

    try {
      if (fs.existsSync(Whisper.destinationPath)) {
        this.ready = true
        return true
      }
    } catch {
      //noop
    }

    this.downloading = true

    logger.info(`Downloading Whisper model from ${Whisper.sourceURL}`)
    const response = await fetch(Whisper.sourceURL)
    const buffer = await response.arrayBuffer()

    logger.info(
      `Writing downloaded Whisper model to ${Whisper.destinationPath}`,
    )
    fs.writeFileSync(Whisper.destinationPath, Buffer.from(buffer))
    this.ready = true
    return true
  }

  public transcribe(filePath: string) {
    if (!this.isReady()) {
      throw new Error('Whisper model is not yet ready')
    }

    if (!executablePath) {
      throw new Error(
        'Whisper executable not found. It is probably not supported on your platform',
      )
    }

    return new Promise<string>((resolve, reject) => {
      exec(
        `${executablePath} -ml 20 -sow true -l en -m ${Whisper.destinationPath} -f ${filePath}`,
        (error: ExecException | null, stdout: string) => {
          if (error) {
            reject(error)
          } else {
            resolve(stdout)
          }
        },
      )
    })
  }
}
