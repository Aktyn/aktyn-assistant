import { AdvancedInput } from '../components/advancedInput'
import { format } from '../utils/contentFormatters'
import { clsx, createElement, createMdiIcon } from '../utils/dom'

import { ChatMenu } from './chatMenu'
import { ViewBase } from './viewBase'

export class ChatView extends ViewBase {
  private readonly converter = new window.showdown.Converter({
    noHeaderId: true,
    smoothLivePreview: true,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
  })
  private readonly messagesContainer: HTMLDivElement
  private readonly input: AdvancedInput
  private readonly inputContainer: HTMLDivElement
  private readonly spinner: HTMLDivElement
  private chatMenu: ChatMenu | null = null

  private activeMessageId: string | null = null
  private activeAiMessageElement: HTMLDivElement | null = null
  private activeAiMessageBuffers = new Map<string, string>()
  private scrollToBottomTimeout: NodeJS.Timeout | null = null
  private formatCodeBlocksTimeout: number | null = null
  private showRawResponse = false
  private stickToBottom = true

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output',
      postProcess: (element) => {
        element.onwheel = () => {
          if (!element.childNodes.length) {
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

    const inputContainer = createElement('div', {
      className: 'chat-view-input-container',
      content: [spinner],
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

    this.messagesContainer = messagesContainer
    this.input = new AdvancedInput((content) => {
      this.sendChatMessage(content).catch(console.error)
      this.input.clear()
    })
    inputContainer.prepend(this.input.element)
    this.inputContainer = inputContainer
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

    this.chatMenu = new ChatMenu(
      {
        onRawResponseToggle: (on) => {
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
        },
        onClearChat: () => {
          this.messagesContainer.innerHTML = ''
          this.activeMessageId = null
          this.activeAiMessageElement = null
          this.activeAiMessageBuffers.clear()
          this.toggleLoading(false)
        },
      },
      {
        showRawResponse: this.showRawResponse,
      },
    )

    this.inputContainer.appendChild(this.chatMenu.optionsMenuButton)
    this.inputContainer.appendChild(this.chatMenu.options)
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
    this.input.setDisabled(loading)
    this.spinner.style.opacity = loading ? '1' : '0'

    if (!loading) {
      this.input.focus()
    }
  }

  private async sendChatMessage(message: UiChatMessage[]) {
    const messageElement = createElement('div', {
      className: clsx('chat-message', 'user'),
      content: message.map((item) => {
        switch (item.type) {
          case 'text':
            return createElement('span', { content: item.content })
          case 'image':
            return createElement('img', {
              style: { width: 'auto', maxWidth: '100%', maxHeight: '8rem' },
              postProcess: (img) => {
                img.src = item.imageData
              },
            })
        }
        return null
      }),
    })
    if (this.messagesContainer.childNodes.length) {
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
