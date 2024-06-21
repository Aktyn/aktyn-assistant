import { Notifications } from '../components/notifications'
import { clsx, createElement, createMdiIcon } from '../utils/dom'

import { ViewBase } from './viewBase'

export class ChatView extends ViewBase {
  private readonly converter = new window.showdown.Converter({
    noHeaderId: true,
    smoothLivePreview: true,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
  })
  private readonly messagesContainer: HTMLDivElement
  private readonly input: HTMLInputElement
  private readonly spinner: HTMLDivElement

  private activeMessageId: string | null = null
  private activeAiMessageElement: HTMLDivElement | null = null
  private activeAiMessageBuffer = ''
  private scrollToBottomTimeout: NodeJS.Timeout | null = null
  private formatCodeBlocksTimeout: number | null = null

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output empty',
      content: 'AI responses will appear here',
    })

    const spinner = createElement('div', {
      className: 'chat-spinner',
      content: createMdiIcon('loading', { spin: true }),
    })

    const optionsMenuButton = createElement('button', {
      className: 'options-menu-button icon-button clean',
      content: createMdiIcon('dots-vertical'),
      postProcess: (button) => {
        button.onclick = () => {
          //TODO: implement
        }
      },
    })

    const input = createElement('input', {
      className: 'chat-input',
      postProcess: (input) => {
        input.maxLength = 2048
      },
    })

    super(
      createElement('div', {
        className: 'chat-view content-container',
        content: [
          messagesContainer,
          createElement('div', {
            className: 'chat-view-input-container',
            content: [input, spinner, optionsMenuButton],
          }),
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

    this.converter.setFlavor('github')

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
        this.activeAiMessageBuffer += chunk.content

        this.scrollToBottom()
        // if (chunk.content.includes('\n')) { //? Possible optimization
        this.formatResponse(this.activeAiMessageElement)
        // }
      }

      if (chunk.finished) {
        if (this.formatCodeBlocksTimeout !== null) {
          cancelAnimationFrame(this.formatCodeBlocksTimeout)
          this.formatCodeBlocksTimeout = null
        }
        this.formatResponse(this.activeAiMessageElement, false)
        this.activeMessageId = null
        this.activeAiMessageElement = null
        this.activeAiMessageBuffer = ''
        this.toggleLoading(false)
      }
    })
  }

  public onOpen() {
    setTimeout(() => {
      this.input.focus()
    }, 1_000)
    super.onOpen()
  }

  private formatResponse(element: HTMLElement, debounce = true) {
    const format = () => {
      const html = this.converter.makeHtml(this.activeAiMessageBuffer)
      element.innerHTML = html
      window.Prism.highlightAllUnder(element, false)
      element.querySelectorAll('pre').forEach((pre) => {
        const header = createCodeBlockHeaderElement(pre)
        if (header) {
          pre.prepend(header)
        }
      })
    }

    if (!debounce) {
      format()
      return
    }

    if (this.formatCodeBlocksTimeout) {
      return
    }

    this.formatCodeBlocksTimeout = requestAnimationFrame(() => {
      // formatMarkdown(element) //TODO: remove markdown directory and this commented line
      format()
      this.formatCodeBlocksTimeout = null
    })
  }

  private scrollToBottom() {
    if (this.scrollToBottomTimeout) {
      return
    }

    this.scrollToBottomTimeout = setTimeout(() => {
      if (this.opened) {
        this.messagesContainer.scrollTo({
          top: this.messagesContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
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
    this.activeAiMessageBuffer = ''
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

  public onExternalData() {}
}

function createCodeBlockHeaderElement(pre: HTMLPreElement) {
  const language = pre.className.replace(/^language-/, '')
  const codeElement = pre.querySelector('code')

  if (!codeElement) {
    return null
  }

  const code = codeElement.textContent ?? ''
  const chevronIcon = createMdiIcon('chevron-up')
  const toggleSpan = createElement('span', { content: ' Hide' })
  let codeHeight = 0

  return createElement('div', {
    className: 'code-block-header',
    content: [
      createElement('div', {
        className: 'language',
        content: language ?? 'Plain text',
      }),
      createElement('div', {
        className: 'code-options',
        content: [
          createElement('button', {
            content: [
              createMdiIcon('content-copy'),
              createElement('span', { content: ' Copy' }),
            ],
            postProcess: (button) => {
              button.onclick = () => {
                navigator.clipboard.writeText(code).catch(console.error)
                Notifications.provider.showNotification(
                  Notifications.type.INFO,
                  {
                    message: 'Copied to clipboard',
                  },
                )
              }
            },
          }),
          createElement('button', {
            content: [chevronIcon, toggleSpan],
            postProcess: (button) => {
              button.onclick = () => {
                codeElement.classList.toggle('hidden')
                chevronIcon.classList.toggle('mdi-flip-v')

                const hidden = codeElement.classList.contains('hidden')
                if (hidden) {
                  toggleSpan.innerText = ' Show'
                } else {
                  toggleSpan.innerText = ' Hide'
                }

                codeHeight = Math.max(
                  codeHeight,
                  codeElement.getBoundingClientRect().height,
                )
                const range = [codeHeight, 0]
                anime({
                  targets: codeElement,
                  easing: 'easeInOutCirc',
                  duration: 200,
                  maxHeight: hidden ? range : range.toReversed(),
                  opacity: hidden ? 0 : 1,
                })
              }
            },
          }),
        ],
      }),
    ],
  })
}
