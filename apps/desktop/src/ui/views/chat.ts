import { Notifications } from '../components/notifications'
import { Switch } from '../components/switch'
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
  private readonly inputContainer: HTMLDivElement
  private readonly spinner: HTMLDivElement

  private activeMessageId: string | null = null
  private activeAiMessageElement: HTMLDivElement | null = null
  private activeAiMessageBuffers = new Map<string, string>()
  private scrollToBottomTimeout: NodeJS.Timeout | null = null
  private formatCodeBlocksTimeout: number | null = null
  private showRawResponse = false
  private stickToBottom = true

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output empty',
      content: 'AI responses will appear here',
      postProcess: (element) => {
        element.onwheel = () => {
          if (element.classList.contains('empty')) {
            return
          }

          const isScrollable =
            element.scrollHeight - element.scrollTop > element.clientHeight
          if (!isScrollable) {
            return
          }

          const isScrolledToBottom =
            Math.abs(
              element.scrollTop + element.clientHeight - element.scrollHeight,
            ) <= 2

          this.stickToBottom = isScrolledToBottom
        }
      },
    })

    const spinner = createElement('div', {
      className: 'chat-spinner',
      content: createMdiIcon('loading', { spin: true }),
    })

    const input = createElement('input', {
      className: 'chat-input',
      postProcess: (input) => {
        input.maxLength = 2048
      },
    })

    const inputContainer = createElement('div', {
      className: 'chat-view-input-container',
      content: [input, spinner],
    })

    super(
      createElement('div', {
        className: 'chat-view content-container',
        content: [
          messagesContainer,
          inputContainer,
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
    this.inputContainer = inputContainer
    this.input = input
    this.spinner = spinner
    this.toggleLoading(false)

    this.initChatMenu().catch(console.error)

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
        const buffer = this.activeAiMessageBuffers.get(messageId) ?? ''
        this.activeAiMessageBuffers.set(messageId, buffer + chunk.content)

        if (this.stickToBottom) {
          this.scrollToBottom()
        }
        // if (chunk.content.includes('\n')) { //? Possible optimization
        this.formatResponse(this.activeAiMessageElement, messageId)
        // }
      }

      if (chunk.finished) {
        if (this.formatCodeBlocksTimeout !== null) {
          cancelAnimationFrame(this.formatCodeBlocksTimeout)
          this.formatCodeBlocksTimeout = null
        }
        this.formatResponse(this.activeAiMessageElement, messageId, false)
        this.activeMessageId = null
        this.activeAiMessageElement = null
        this.toggleLoading(false)
      }
    })
  }

  private async initChatMenu() {
    this.showRawResponse =
      (await window.electronAPI.getUserConfigValue('showRawResponse')) ?? false

    const toggle = (on: boolean) => {
      if (on) {
        options.classList.add('active')
      } else {
        options.classList.remove('active')
      }

      anime({
        targets: optionsMenuButton,
        easing: 'spring(1, 80, 10, 0)',
        translateX: on ? '4rem' : '0rem',
        opacity: on ? 0 : 1,
      })
      anime({
        targets: options,
        easing: 'spring(1, 80, 10, 0)',
        translateX: on ? '0rem' : '4rem',
        opacity: on ? 1 : 0,
      })
      anime({
        targets: options.querySelectorAll(':scope > *'),
        easing: 'spring(1, 80, 10, 0)',
        scale: on ? 1 : 0,
        opacity: on ? 1 : 0,
      })
    }

    const optionsMenuButton = createElement('button', {
      className: 'options-menu-button icon-button clean',
      content: createMdiIcon('dots-vertical'),
      postProcess: (button) => {
        button.onclick = () => toggle(true)
      },
    })

    const optionsCloseButton = createElement('button', {
      className: 'options-close-button icon-button clean',
      content: createMdiIcon('close'),
      postProcess: (button) => {
        button.onclick = () => toggle(false)
      },
    })

    const rawResponseSwitch = new Switch(this.showRawResponse, (on) => {
      this.showRawResponse = on
      window.electronAPI.setUserConfigValue('showRawResponse', on)

      const messageContainers =
        this.messagesContainer.querySelectorAll<HTMLDivElement>(
          '.chat-message.ai',
        )
      for (const messageContainer of messageContainers) {
        const messageId = messageContainer.dataset.messageId
        if (!messageId) {
          console.warn('Message id not found in message container')
          continue
        }
        const rawContent = this.activeAiMessageBuffers.get(messageId) ?? ''

        if (on) {
          messageContainer.innerText = rawContent
        } else {
          messageContainer.innerHTML = this.converter.makeHtml(
            messageContainer.innerText,
          )

          format(this.converter, messageContainer, rawContent)
        }
      }
    })

    const options = createElement('div', {
      className: 'options',
      content: [
        createElement('div', {
          className: 'flex',
          content: [
            createElement('span', {
              className: 'switch-label',
              content: 'Show raw response:',
            }),
            rawResponseSwitch.element,
          ],
        }),
        createElement('hr', { className: 'vertical' }),
        optionsCloseButton, // Add the close button right into the options element
      ],
    })

    this.inputContainer.appendChild(optionsMenuButton)
    this.inputContainer.appendChild(options)
  }

  public onOpen() {
    setTimeout(() => {
      if (this.opened) {
        this.input.focus()
      }
    }, 1_000)
    super.onOpen()
  }

  private formatResponse(
    element: HTMLElement,
    messageId: string,
    debounce = true,
  ) {
    if (this.showRawResponse) {
      element.innerText = this.activeAiMessageBuffers.get(messageId) ?? ''
      return
    }

    if (!debounce) {
      format(
        this.converter,
        element,
        this.activeAiMessageBuffers.get(messageId) ?? '',
      )
      return
    }

    if (this.formatCodeBlocksTimeout) {
      return
    }

    this.formatCodeBlocksTimeout = requestAnimationFrame(() => {
      format(
        this.converter,
        element,
        this.activeAiMessageBuffers.get(messageId) ?? '',
      )
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

    const model =
      await window.electronAPI.getUserConfigValue('selectedChatModel')
    if (!model) {
      throw new Error('Chat model is not set')
    }

    const id = Math.random().toString(36).substring(2)
    this.activeAiMessageElement = createElement('div', {
      className: clsx('chat-message', 'ai'),
      content: '',
      postProcess: (element) => {
        element.dataset.messageId = id
      },
    })
    this.activeAiMessageBuffers.set(id, '')
    this.messagesContainer.appendChild(this.activeAiMessageElement)

    anime({
      targets: [messageElement, this.activeAiMessageElement],
      easing: 'spring(1, 80, 10, 0)',
      opacity: [0, 1],
      translateX: ['4rem', '0rem'],
      delay: anime.stagger(200, { from: 'first' }),
    })

    this.scrollToBottom()
    this.stickToBottom = true

    this.toggleLoading(true)
    this.activeMessageId = id
    window.electronAPI.performChatQuery(message, model, this.activeMessageId)
  }

  public onExternalData() {}
}

function format(
  converter: showdown.Converter,
  element: HTMLElement,
  rawContent: string,
) {
  const html = converter.makeHtml(rawContent)
  element.innerHTML = html
  window.Prism.highlightAllUnder(element, false)
  element.querySelectorAll('pre').forEach((pre) => {
    const header = createCodeBlockHeaderElement(pre)
    if (header) {
      pre.prepend(header)
    }
  })
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
