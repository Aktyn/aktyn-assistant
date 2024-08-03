import type { ChatMessage, ChatResponse, Stream } from '@aktyn-assistant/common'
import { logger } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'
import type { AnimatedText } from 'terminal-kit/Terminal'
import { v4 as uuidv4 } from 'uuid'

import {
  handleChatResponseTimeout,
  handleStreamedChatResponse,
} from './chat-helpers'
import {
  addNewLine,
  clearTerminal,
  showEscapeToReturnToMenuInfo,
} from './common'
import { View } from './view'

export class ChatView extends View {
  private spinner: AnimatedText | null = null
  private chatStream: Stream<ChatResponse> | null = null
  private abortChatMessageInput: (() => void) | null = null
  private conversationId = uuidv4()

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

    super.cancelSpeaking()
  }

  open() {
    this.conversationId = uuidv4()
    clearTerminal()
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
        maxLength: 16777216,
      },
      (error, value) => {
        if (error) {
          this.handleError(error)
          return
        }

        value = value?.trim() ?? ''
        this.abortChatMessageInput = null
        if (value) {
          this.handleMessageInput({
            conversationId: this.conversationId,
            contents: [{ type: 'text', content: value }],
          }).catch((error) => {
            logger.error(error)
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

  private async handleMessageInput(message: ChatMessage) {
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
      const stream = (this.chatStream = await this.sendChatMessage(message))
      await handleStreamedChatResponse(stream, {
        onStart: () => this.spinner?.animate(false),
      })

      if (stream.controller.signal.aborted || !this.chatStream) {
        if (handleChatResponseTimeout(this.chatStream)) {
          this.spinner?.animate(false)
          this.spinner = null

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
