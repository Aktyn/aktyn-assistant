import { execSync, spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'

import {
  assert,
  type ChatMessage,
  type ChatResponse,
  type Stream,
} from '@aktyn-assistant/common'
import {
  getAudioOutputDirectory,
  getDataDirectory,
  logger,
  removeOutdatedAudioFiles,
} from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'
import type { AnimatedText } from 'terminal-kit/Terminal'
import kill from 'tree-kill'
import { v4 as uuidv4 } from 'uuid'

import { printError } from '../error'

import {
  handleChatResponseTimeout,
  handleStreamedChatResponse,
} from './chat-helpers'
import { clearTerminal, showEscapeToReturnToMenuInfo } from './common'
import { View } from './view'

export class VoiceChatView extends View {
  private aborted = false
  private secondarySpinner: { stop: () => void } | null = null
  private spinner: AnimatedText | null = null
  private rhasspyWhisperPath: string | null = null
  private rhasspyProcess: ChildProcess | null = null
  private killRhasspyProcessListener = this.killRhasspyProcess.bind(this)
  private transcribedVoiceCommandsQueue: Array<string> = []
  private chatStream: Stream<ChatResponse> | null = null
  private conversationId = uuidv4()

  abortAsynchronousActions() {
    this.aborted = true
    this.secondarySpinner?.stop()
    this.secondarySpinner = null

    if (this.spinner) {
      this.spinner.animate(false)
      this.spinner = null
    }
    if (this.chatStream) {
      this.chatStream.controller.abort('User aborted')
      this.chatStream = null
    }

    super.cancelSpeaking()

    this.killRhasspyProcess()

    process.removeListener('beforeExit', this.killRhasspyProcessListener)
    process.removeListener('SIGINT', this.killRhasspyProcessListener)
    process.removeListener('SIGTERM', this.killRhasspyProcessListener)
    process.removeListener('uncaughtException', this.killRhasspyProcessListener)
    process.removeListener('exit', this.killRhasspyProcessListener)
  }

  private killRhasspyProcess() {
    if (this.rhasspyProcess) {
      const pid = this.rhasspyProcess.pid
      logger.info(`Killing rhasspy process: ${pid}`)
      if (pid) {
        kill(pid, 'SIGKILL', (error) => {
          if (error) {
            logger.error(error)
          } else {
            logger.info(`Rhasspy process killed: ${pid}`)
          }
        })
      } else {
        this.rhasspyProcess.kill('SIGTERM')
      }

      this.rhasspyProcess.removeAllListeners()
      this.rhasspyProcess = null
    }
  }

  open() {
    this.conversationId = uuidv4()
    this.initVoiceChat().catch(this.handleError)
  }

  private async initVoiceChat() {
    clearTerminal()

    showEscapeToReturnToMenuInfo()
    terminal.eraseLineAfter('\n')
    terminal.eraseLineAfter('\n')

    const success = await this.checkRhasspyWhisper()
    if (!success) {
      return
    }

    await this.startVoiceChat().catch(this.handleError)
  }

  private async startVoiceChat() {
    assert(!!this.rhasspyWhisperPath, 'Rhasspy whisper path is not set')

    clearTerminal()
    terminal.moveTo(1, terminal.height - 1)
    terminal.cyan.bold('Listening for voice commands')
    terminal.eraseLineAfter('\n')
    showEscapeToReturnToMenuInfo(true)

    removeOutdatedAudioFiles()
    const audioOutputDir = getAudioOutputDirectory()
    const modelsDir = path.join(getDataDirectory(), 'models')
    const command = `arecord -r 16000 -f S16_LE -c 1 -t raw | ${this.rhasspyWhisperPath} --sensitivity 1 --trim-silence --speech-seconds 1 --min-seconds 2 --max-seconds 30 --before-seconds 2 --silence-seconds 3 --chunk-size 30 --output-type transcription --audio-output-dir "${audioOutputDir}" --models-dir "${modelsDir}"`

    if (os.platform() !== 'win32') {
      try {
        execSync('pkill -f "python3 -m rhasspywhisper"', {
          stdio: 'ignore',
          encoding: 'utf8',
        })
        execSync(`pkill -f "${escapeDoubleQuotes(command)}"`, {
          stdio: 'ignore',
          encoding: 'utf8',
        })
      } catch {
        // noop
      }
    }

    fs.mkdirSync(getAudioOutputDirectory(), { recursive: true })
    fs.mkdirSync(modelsDir, { recursive: true })

    logger.info(`Starting rhasspy process: ${command}`)
    //TODO: consider muting audio or pausing rhasspy process while assistant is speaking
    this.rhasspyProcess = spawn(command, {
      shell: true,
      windowsHide: true,
      stdio: 'pipe',
      killSignal: 'SIGKILL',
    })
    logger.info(`Rhasspy process started: ${this.rhasspyProcess.pid}`)
    this.rhasspyProcess.on('error', (error) => {
      logger.error(error)
      printError({
        title: 'Rhasspy error',
        message: error instanceof Error ? error.message : String(error),
      })
    })
    for (let i = 0; i < this.rhasspyProcess.stdio.length; i++) {
      const stream = this.rhasspyProcess.stdio[i]
      if (!stream || !(stream instanceof Readable)) {
        continue
      }
      stream.on('data', (rhasspyWhisperData) => {
        const data = rhasspyWhisperData.toString()
        logger.info({ rhasspyWhisperOutput: data })

        const prefix = 'INFO:rhasspy-whisper:'
        const prefixIndex = data.indexOf(prefix)
        if (!data || prefixIndex === -1) {
          return
        }
        const transcription = data.substring(prefixIndex + prefix.length).trim()
        if (transcription.length > 0) {
          this.queueTranscribedVoiceCommand(transcription)
        }
      })
    }
    process.addListener('beforeExit', this.killRhasspyProcessListener)
    process.addListener('SIGINT', this.killRhasspyProcessListener)
    process.addListener('SIGTERM', this.killRhasspyProcessListener)
    process.addListener('uncaughtException', this.killRhasspyProcessListener)
    process.addListener('exit', this.killRhasspyProcessListener)
  }

  private async checkRhasspyWhisper() {
    if (!process.env.RHASSPY_WHISPER) {
      printError({
        title: 'RHASSPY_WHISPER is not set as environment variable',
      })
      return false
    }

    this.rhasspyWhisperPath = resolveHome(process.env.RHASSPY_WHISPER)

    if (this.rhasspyWhisperPath.includes(' ')) {
      printError({
        title: `RHASSPY_WHISPER contains spaces (${this.rhasspyWhisperPath})`,
      })
      return false
    }

    try {
      execSync(`${this.rhasspyWhisperPath} --help`, {
        stdio: 'ignore',
        encoding: 'utf8',
      })
    } catch {
      printError({
        title: 'Rhasspy whisper error',
        message: 'Provided path is not valid rhasspy whisper executable/script',
      })
      return false
    }

    return true
  }

  private async processNextTranscribedVoiceCommand(): Promise<void> {
    const transcribedText = this.transcribedVoiceCommandsQueue.at(0)
    if (!transcribedText || this.aborted) {
      return
    }

    try {
      logger.info(`Transcribed voice command: "${transcribedText}"`)
      const text = trimArbitrarySounds(transcribedText)

      if (this.aborted) {
        return
      }
      if (!text.length) {
        terminal.eraseLine('\n').yellow(`Skipping empty transcription`)
      } else {
        terminal.eraseLine('\n').cyan(`Transcribed voice command: "${text}"`)
      }
      terminal.eraseLineAfter('\n')
      showEscapeToReturnToMenuInfo(true)

      if (text) {
        terminal.eraseLineAfter('\n')
        await this.processChatMessage({
          conversationId: this.conversationId,
          contents: [{ type: 'text', content: text }],
        })
      }
    } catch (error) {
      logger.error(error)
    }

    this.transcribedVoiceCommandsQueue.shift()
    return await this.processNextTranscribedVoiceCommand()
  }

  private async processChatMessage(message: ChatMessage) {
    const startSpinner = () => {
      return terminal.eraseLine().gray('Processing ').spinner('impulse')
    }

    const printPostChatMessage = () => {
      terminal.gray(Array.from({ length: terminal.width }, () => '-').join(''))
      terminal.eraseLineAfter('\n')
      terminal.cyan.bold('Listening for voice commands')
      terminal.eraseLineAfter('\n')
      showEscapeToReturnToMenuInfo(true)
    }

    try {
      terminal.eraseLine('\n')
      this.spinner = await startSpinner()
      terminal.eraseLineAfter('\n')
      if (this.chatStream) {
        this.chatStream.controller.abort('Stream replaced')
        this.chatStream = null
      }
      const stream = (this.chatStream = await this.sendChatMessage(message))
      await handleStreamedChatResponse(stream, {
        onStart: () => this.spinner?.animate(false),
      })

      if (stream.controller.signal.aborted || !this.chatStream) {
        if (handleChatResponseTimeout(this.chatStream)) {
          this.spinner?.animate(false)
          this.spinner = null

          printPostChatMessage()
        }

        return
      }

      this.chatStream = null

      this.spinner?.animate(false)
      this.spinner = null
      for (let i = 0; i < 2; i++) {
        terminal.eraseLineAfter('\n')
      }

      printPostChatMessage()
    } catch (error) {
      this.handleError(error)
    }
  }

  private queueTranscribedVoiceCommand(transcription: string) {
    this.transcribedVoiceCommandsQueue.push(transcription)
    if (this.transcribedVoiceCommandsQueue.length === 1) {
      this.processNextTranscribedVoiceCommand().catch(this.handleError)
    }
  }
}

function resolveHome(filepath: string) {
  if (filepath[0] === '~') {
    return path.join(os.homedir(), filepath.slice(1))
  }
  return filepath
}

function escapeDoubleQuotes(str: string) {
  return str.replace(/"/g, '\\"')
}

function trimArbitrarySounds(transcribedCommand: string) {
  return transcribedCommand
    .replace(/[♪]/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\([^)]+\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
