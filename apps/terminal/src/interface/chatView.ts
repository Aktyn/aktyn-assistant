import type { ChatResponse, Stream } from '@aktyn-assistant/common'
import { terminal } from 'terminal-kit'
import type { AnimatedText } from 'terminal-kit/Terminal'

import { printError } from '../error'

import { addNewLine, getRoleColor, showEscapeToReturnToMenuInfo } from './common'
import { View } from './view'

export class ChatView extends View {
  private spinner: AnimatedText | null = null
  private chatStream: InstanceType<typeof Stream<ChatResponse>> | null = null
  private abortChatMessageInput: (() => void) | null = null

  abortAsynchronousActions() {
    if (this.spinner) {
      this.spinner.animate(false)
      this.spinner = null
    }
    if (this.chatStream) {
      this.chatStream.controller.abort('User aborted')
      this.chatStream = null
    }
    if (this.abortChatMessageInput) {
      this.abortChatMessageInput()
      this.abortChatMessageInput = null
    }
  }

  open() {
    terminal.eraseDisplay()
    this.requestChatMessage()
  }

  private requestChatMessage() {
    showEscapeToReturnToMenuInfo()

    terminal
      .moveTo(1, terminal.height - 3)
      .gray(Array.from({ length: terminal.width }, () => '-').join(''))
    const messageInfo = 'Type your message: '
    terminal.moveTo(1, terminal.height - 2).gray(messageInfo)

    const { abort } = terminal.inputField(
      {
        cancelable: true,
        maxLength: 1024,
      },
      (error, value) => {
        if (error) {
          this.handleError(error)
          return
        }

        value = value?.trim() ?? ''
        this.abortChatMessageInput = null
        if (value) {
          this.handleMessageInput(value).catch((error) => {
            console.error(error)
            process.exit(1)
          })
        } else {
          terminal.eraseLine()
          this.requestChatMessage()
        }
      },
    )
    this.abortChatMessageInput = abort
  }

  private async handleMessageInput(message: string) {
    addNewLine()
    showEscapeToReturnToMenuInfo()

    const startSpinner = () => {
      terminal.moveTo(1, terminal.height - 2).eraseLine()
      return terminal.gray('Processing ').spinner('impulse')
    }

    try {
      this.spinner = await startSpinner()
      if (this.chatStream) {
        this.chatStream.controller.abort('Stream replaced')
        this.chatStream = null
      }
      const stream = (this.chatStream = await this.api.ai.sendChatMessage(message))
      let first = true
      for await (const chunk of stream) {
        if (stream.controller.signal.aborted || !this.chatStream) {
          break
        }

        if (first) {
          this.spinner?.animate(false)
          terminal.moveTo(1, terminal.height - 1).eraseLine()
          terminal.moveTo(1, terminal.height - 2).eraseLine()
          terminal.grey
            .bold('Chat response:')
            .grey(`\t(${new Date().toLocaleTimeString()})\t`)
            .yellow.bold('Press ESC to return to menu\n')
          first = false
        }

        terminal.color(getRoleColor(chunk.role), chunk.content)

        //TODO: adjust to real responses which seem to never finish
        if (chunk.finished) {
          terminal.brightGreen.bold('\nResponse completed ✓')
        }
      }

      if (stream.controller.signal.aborted || !this.chatStream) {
        if (this.chatStream && this.chatStream.controller.signal.reason === 'Timeout') {
          this.spinner?.animate(false)
          this.spinner = null

          terminal.moveTo(1, terminal.height - 1).eraseLine()
          printError({
            title: 'Chat response timeout',
            message: 'Chat response took too long to complete. Please try again.',
          })

          for (let i = 0; i < 2; i++) {
            addNewLine()
          }
          this.requestChatMessage()
        }
        return
      }

      this.chatStream = null

      this.spinner?.animate(false)
      this.spinner = null
      for (let i = 0; i < 3; i++) {
        addNewLine()
      }
      this.requestChatMessage()
    } catch (error) {
      this.handleError(error)
    }
  }
}
