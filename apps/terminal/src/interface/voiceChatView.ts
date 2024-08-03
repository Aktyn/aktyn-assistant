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
  initWhisper,
  logger,
  removeOutdatedAudioFiles,
  speechToText,
} from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'
import type { AnimatedText } from 'terminal-kit/Terminal'
import kill from 'tree-kill'
import { v4 as uuidv4 } from 'uuid'

import { printError } from '../error'
import { showSpinner } from '../loading'

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
  private rhasspySilencePath: string | null = null
  private rhasspyProcess: ChildProcess | null = null
  private killRhasspyProcessListener = this.killRhasspyProcess.bind(this)
  private voiceCommandsQueue: Array<string> = []
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

    const success = await this.checkRhasspySilence()
    if (!success) {
      return
    }

    try {
      await this.initWhisper()
    } catch (error) {
      this.secondarySpinner?.stop()
      this.secondarySpinner = null

      logger.error(error, 'Whisper initialization error')
      printError({ title: 'Whisper initialization error' })
    }

    await this.startVoiceChat().catch(this.handleError)
  }

  private async startVoiceChat() {
    assert(!!this.rhasspySilencePath, 'Rhasspy silence path is not set')

    clearTerminal()
    terminal.moveTo(1, terminal.height - 1)
    terminal.cyan.bold('Listening for voice commands')
    terminal.eraseLineAfter('\n')
    showEscapeToReturnToMenuInfo(true)

    removeOutdatedAudioFiles()
    const outputDir = getAudioOutputDirectory()
    const command = `arecord -r 16000 -f S16_LE -c 1 -t raw | ${this.rhasspySilencePath} --sensitivity 1 --split-dir ${outputDir} --trim-silence --speech-seconds 1 --min-seconds 2 --before-seconds 1 --silence-seconds 3 --chunk-size 30 --output-type none`

    if (os.platform() !== 'win32') {
      try {
        execSync('pkill -f "python3 -m rhasspysilence"', {
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
      stream.on('data', (data) => {
        data = data.toString()

        if (!data) {
          return
        }
        const generatedFilePathIndex = data.indexOf(outputDir)
        if (generatedFilePathIndex === -1) {
          return
        }
        const generatedFilePath = data.substring(generatedFilePathIndex).trim()
        if (
          generatedFilePath.endsWith('.wav') &&
          fs.existsSync(generatedFilePath)
        ) {
          this.queueVoiceCommand(generatedFilePath)
        }
      })
    }
    process.addListener('beforeExit', this.killRhasspyProcessListener)
    process.addListener('SIGINT', this.killRhasspyProcessListener)
    process.addListener('SIGTERM', this.killRhasspyProcessListener)
    process.addListener('uncaughtException', this.killRhasspyProcessListener)
    process.addListener('exit', this.killRhasspyProcessListener)
  }

  private async checkRhasspySilence() {
    if (!process.env.RHASSPY_SILENCE) {
      printError({ title: 'Rhasspy silence is not available' })
      return false
    }

    this.rhasspySilencePath = resolveHome(process.env.RHASSPY_SILENCE)

    try {
      execSync(`${this.rhasspySilencePath} --help`, {
        stdio: 'ignore',
        encoding: 'utf8',
      })
    } catch (error) {
      printError({
        title: 'Rhasspy silence error',
        message: 'Provided path is not valid rhasspy silence executable/script',
      })
      return false
    }

    return true
  }

  private async initWhisper() {
    this.secondarySpinner = await showSpinner(
      'Initializing Whisper (this may take a while) ...',
    )
    const supported = await initWhisper()
    if (this.aborted) {
      return
    }

    this.secondarySpinner?.stop()
    this.secondarySpinner = null

    if (!supported) {
      logger.warn('Whisper is not supported on this platform')
      printError({ title: 'Whisper is not supported on this platform' })
      return
    }
    logger.info('Whisper initialized')
    terminal.bold.green('Whisper initialized')
  }

  private async processNextCommand(): Promise<void> {
    const filePath = this.voiceCommandsQueue.at(0)
    if (!filePath || this.aborted) {
      return
    }
    logger.info(`Processing voice command audio file: ${filePath}`)

    terminal.eraseLine('\n').cyan(`Transcribing ${path.basename(filePath)} `)
    const transcribingSpinner = await terminal.spinner('dotSpinner')

    terminal.eraseLineAfter('\n')
    showEscapeToReturnToMenuInfo(true)

    try {
      const text = trimArbitrarySounds(await speechToText(filePath))
      transcribingSpinner.animate(false)

      if (this.aborted) {
        return
      }
      if (!text.length) {
        terminal.eraseLine('\n').yellow(`Skipping empty voice command`)
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
      transcribingSpinner.animate(false)
    }

    const processedFile = this.voiceCommandsQueue.shift()
    if (processedFile) {
      try {
        logger.info(
          `Removing processed voice command audio file: ${processedFile}`,
        )
        fs.unlinkSync(processedFile)
      } catch (error) {
        logger.error(error)
      }
    }
    return await this.processNextCommand()
  }

  private queueVoiceCommand(filePath: string) {
    this.voiceCommandsQueue.push(filePath)
    if (this.voiceCommandsQueue.length === 1) {
      this.processNextCommand().catch(this.handleError)
    }
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
