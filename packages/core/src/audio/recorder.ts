import fs from 'fs'
import path from 'path'

import { assert, once } from '@aktyn-assistant/common'
//@ts-expect-error missing typings
// eslint-disable-next-line import/order
import * as ffmetadata from 'ffmetadata'

//@ts-expect-error ignore error since only type is imported here
import type Mic from 'node-mic'
import { v4 as uuidv4 } from 'uuid'

import {
  getAudioOutputDirectory,
  removeOutdatedAudioFiles,
} from './audio-helpers'

const getNodeMic = once(() =>
  import('node-mic').then(({ default: NodeMic }) => NodeMic),
)

export class AudioRecorder {
  private recordingPromise: Promise<string> | null = null
  private mic: Mic | null = null

  constructor(private audioDir = getAudioOutputDirectory()) {}

  private async init() {
    const NodeMic = await getNodeMic()

    const sampleRate = 16000
    return new NodeMic({
      rate: sampleRate,
      channels: 1,
      // threshold: 6,
      fileType: 'wav',
    })
  }

  start() {
    if (this.recordingPromise) {
      throw new Error('Recording is already in progress')
    }

    removeOutdatedAudioFiles()

    const outputFile = path.join(this.audioDir, `voice-command-${uuidv4()}.wav`)
    const outputFileStream = fs.createWriteStream(outputFile)

    this.recordingPromise = this.init().then((mic) => {
      const micInputStream = mic.getAudioStream()
      micInputStream.pipe(outputFileStream)

      //TODO: try process it with https://github.com/voixen/voixen-vad for auto voice commands recognition
      // micInputStream.on('data', (data: Buffer) => { ... })
      micInputStream.on('error', (err) => {
        console.error(`Microphone input stream error: ${err.message}`)
      })

      this.mic = mic
      mic.start()

      return new Promise<string>((resolve, reject) => {
        outputFileStream.on('finish', () => {
          this.recordingPromise = null

          ffmetadata.write(outputFile, {}, (err: unknown) => {
            if (err) {
              reject(err)
            } else {
              resolve(outputFile)
            }
          })
        })
        outputFileStream.on('error', (error) => {
          this.recordingPromise = null
          reject(error)
        })
      })
    })
  }

  end() {
    assert(!!this.mic, 'Mic is not initialized')
    assert(!!this.recordingPromise, 'No recording in progress')

    const promise = this.recordingPromise
    this.mic?.stop()
    this.recordingPromise = null
    return promise
  }
}
