import { clsx, createElement, createMdiIcon } from '../domUtils'

import { ViewBase } from './viewBase'

export class ChatView extends ViewBase {
  private readonly messagesContainer: HTMLDivElement
  private readonly input: HTMLInputElement
  private readonly spinner: HTMLDivElement

  private activeMessageId: string | null = null
  private activeAiMessageElement: HTMLDivElement | null = null

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output empty',
      content: 'AI responses will appear here',
    })

    const input = createElement('input', {
      className: 'chat-input',
      postProcess: (input) => {
        input.placeholder = 'Type your message...'
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
          createElement('div', { className: 'handle', content: createMdiIcon('cursor-move') }),
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

    setTimeout(() => {
      input.focus()
    }, 16)

    this.messagesContainer = messagesContainer
    this.input = input
    this.spinner = spinner

    window.electronAPI.onChatResponse((messageId, chunk) => {
      if (!this.activeMessageId || !this.activeAiMessageElement) {
        console.warn('Received unexpected chat response', messageId)
        return
      }

      if (messageId !== this.activeMessageId) {
        console.warn('Received chat response for unknown message', messageId)
        return
      }

      console.log('Received chat response:', chunk) //TODO: remove
      if (chunk.content) {
        this.activeAiMessageElement.innerText += chunk.content
        this.messagesContainer.scrollTo({
          top: this.messagesContainer.scrollHeight,
          behavior: 'smooth',
        })
      }

      if (chunk.finished) {
        this.activeMessageId = null
        this.activeAiMessageElement = null
        this.input.disabled = false
        this.input.placeholder = 'Type your message...'
        this.spinner.style.opacity = '0'
      }
    })
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
    this.activeAiMessageElement.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    })

    this.input.placeholder = ''
    this.input.disabled = true
    this.spinner.style.opacity = '1'

    const model = await window.electronAPI.getUserConfigValue('selectedChatModel')
    if (!model) {
      throw new Error('Chat model is not set')
    }

    this.activeMessageId = Math.random().toString(36).substring(2)
    window.electronAPI.performChatQuery(message, model, this.activeMessageId)
  }
}
