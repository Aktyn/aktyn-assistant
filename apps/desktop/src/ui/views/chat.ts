import { formatCodeBlocks } from '../utils/codeBlocks'
import { clsx, createElement, createMdiIcon } from '../utils/dom'

import { ViewBase } from './viewBase'

export class ChatView extends ViewBase {
  private readonly messagesContainer: HTMLDivElement
  private readonly input: HTMLInputElement
  private readonly spinner: HTMLDivElement

  private activeMessageId: string | null = null
  private activeAiMessageElement: HTMLDivElement | null = null
  private scrollToBottomTimeout?: NodeJS.Timeout | null = null
  private formatCodeBlocksTimeout?: NodeJS.Timeout | null = null

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output empty',
      content: 'AI responses will appear here',
    })

    const input = createElement('input', {
      className: 'chat-input',
      postProcess: (input) => {
        input.maxLength = 2048
      },
    })

    const spinner = createElement('div', {
      className: 'chat-spinner',
      content: createMdiIcon('loading', { spin: true }),
    })

    super(
      createElement('div', {
        className: 'chat-view content-container',
        content: [
          messagesContainer,
          input,
          spinner,
          createElement('div', {
            className: 'handle',
            content: [
              createMdiIcon('cursor-move'),
              createElement('span', {
                content: 'Grab here to move the window',
              }),
            ],
          }),
        ],
      }),
    )

    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        const content = input.value.trim()
        if (!content) {
          return
        }

        event.preventDefault()
        this.sendChatMessage(input.value).catch(console.error)
        input.value = ''
      }
    }

    this.messagesContainer = messagesContainer
    this.input = input
    this.spinner = spinner
    this.toggleLoading(false)

    window.electronAPI.onChatResponse((messageId, chunk) => {
      if (!this.activeMessageId || !this.activeAiMessageElement) {
        console.warn('Received unexpected chat response', messageId)
        return
      }

      if (messageId !== this.activeMessageId) {
        console.warn('Received chat response for unknown message', messageId)
        return
      }

      if (chunk.content) {
        let lastChild = this.activeAiMessageElement.children.item(
          this.activeAiMessageElement.children.length - 1,
        ) as HTMLSpanElement
        if (!lastChild || lastChild.nodeName.toUpperCase() !== 'SPAN') {
          const span = createElement('span', { content: chunk.content })
          this.activeAiMessageElement.appendChild(span)
          lastChild = span
        } else {
          lastChild.innerText += chunk.content
        }
        this.scrollToBottom()
        this.formatCodeBlocksDebounced(lastChild)
      }

      if (chunk.finished) {
        this.activeMessageId = null
        this.activeAiMessageElement = null
        this.toggleLoading(false)
      }
    })
  }

  public onOpen() {
    setTimeout(() => {
      this.input.focus()
    }, 500)
    super.onOpen()
  }

  private formatCodeBlocksDebounced(element: HTMLElement) {
    if (this.formatCodeBlocksTimeout) {
      return
    }

    this.formatCodeBlocksTimeout = setTimeout(() => {
      formatCodeBlocks(element)

      this.formatCodeBlocksTimeout = null
    }, 500)
  }

  private scrollToBottom() {
    if (this.scrollToBottomTimeout || !this.opened) {
      return
    }

    this.scrollToBottomTimeout = setTimeout(() => {
      this.messagesContainer.scrollTo({
        top: this.messagesContainer.scrollHeight,
        behavior: 'smooth',
      })
      this.scrollToBottomTimeout = null
    }, 100)
  }

  private toggleLoading(loading: boolean) {
    this.input.placeholder = loading ? '' : 'Type your message...'
    this.input.disabled = loading
    this.spinner.style.opacity = loading ? '1' : '0'

    if (!loading) {
      this.input.focus()
    }
  }

  private async sendChatMessage(message: string) {
    let first = false
    if (this.messagesContainer.classList.contains('empty')) {
      first = true
      this.messagesContainer.innerText = ''
      this.messagesContainer.classList.remove('empty')
    }
    const messageElement = createElement('div', {
      className: clsx('chat-message', 'user'),
      content: message,
    })
    if (!first) {
      this.messagesContainer.appendChild(createElement('hr'))
    }
    this.messagesContainer.appendChild(messageElement)

    this.activeAiMessageElement = createElement('div', {
      className: clsx('chat-message', 'ai'),
      content: '',
    })
    this.messagesContainer.appendChild(this.activeAiMessageElement)

    anime({
      targets: [messageElement, this.activeAiMessageElement],
      easing: 'spring(1, 80, 10, 0)',
      opacity: [0, 1],
      translateX: ['4rem', '0rem'],
      delay: anime.stagger(200, { from: 'first' }),
    })

    this.scrollToBottom()

    this.toggleLoading(true)

    const model =
      await window.electronAPI.getUserConfigValue('selectedChatModel')
    if (!model) {
      throw new Error('Chat model is not set')
    }

    this.activeMessageId = Math.random().toString(36).substring(2)
    window.electronAPI.performChatQuery(message, model, this.activeMessageId)
  }
}
