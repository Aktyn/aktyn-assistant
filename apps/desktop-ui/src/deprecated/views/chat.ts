import { ChatMessage } from '@aktyn-assistant/common'
import { AdvancedInput } from '../components/advancedInput'
import { randomString } from '../utils/common'
import { format } from '../utils/contentFormatters'
import { clsx, createElement, createMdiIcon } from '../utils/dom'

import { ChatMenu } from './chatMenu'
import { ViewBase } from './viewBase'
import anime from 'animejs'
import { Converter } from 'showdown'

export class ChatView extends ViewBase {
  private readonly converter = new Converter({
    noHeaderId: true,
    smoothLivePreview: true,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
  })
  private readonly messagesContainer: HTMLDivElement
  private readonly input: AdvancedInput
  private readonly spinner: HTMLDivElement
  private chatMenu: ChatMenu | null = null

  private activeMessageId: string | null = null
  private conversationId = randomString()
  private activeAiMessageElement: HTMLDivElement | null = null
  private activeAiMessageBuffers = new Map<string, string>()
  private scrollToBottomTimeout: NodeJS.Timeout | null = null
  private formatCodeBlocksTimeout: number | null = null
  private stickToBottom = true

  constructor() {
    const messagesContainer = createElement('div', {
      className: 'chat-output empty',
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
    this.input = new AdvancedInput((contents) => {
      this.sendChatMessage({
        conversationId: this.conversationId,
        contents,
      }).catch(console.error)
      this.input.clear()
    })
    inputContainer.prepend(this.input.element)
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
      if (chunk.conversationId !== this.conversationId) {
        console.warn(
          'Received chat response for unknown conversation',
          chunk.conversationId,
        )
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
    this.chatMenu = new ChatMenu({
      onRawResponseToggle: (on) => {
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
        for (const child of [
          ...this.messagesContainer.querySelectorAll('.chat-message'),
          ...this.messagesContainer.querySelectorAll(':scope > hr'),
        ]) {
          child.remove()
        }
        this.messagesContainer.classList.add('empty')
        this.activeMessageId = null
        this.conversationId = randomString()
        this.activeAiMessageElement = null
        this.activeAiMessageBuffers.clear()
        this.toggleLoading(false)
      },
    })

    await this.chatMenu.sync()

    this.messagesContainer.appendChild(this.chatMenu.optionsMenuButton)
    this.messagesContainer.appendChild(this.chatMenu.options)
  }

  public onOpen() {
    setTimeout(() => {
      if (this.opened) {
        this.input.focus()
      }
    }, 1_000)
    this.chatMenu?.sync().catch(console.error)
    super.onOpen()
  }

  private formatResponse(
    element: HTMLElement,
    messageId: string,
    debounce = true,
  ) {
    if (this.chatMenu?.showRawResponse) {
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

    if (!loading && this.opened) {
      this.input.focus()
    }
  }

  private async sendChatMessage(message: ChatMessage) {
    const messageElement = createElement('div', {
      className: clsx('chat-message', 'user'),
      content: message.contents.map((item: ChatMessage['contents'][number]) => {
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
    if (this.messagesContainer.childNodes.length > 2) {
      this.messagesContainer.appendChild(createElement('hr'))
    }
    this.messagesContainer.appendChild(messageElement)
    this.messagesContainer.classList.remove('empty')

    const model =
      await window.electronAPI.getUserConfigValue('selectedChatModel')
    if (!model) {
      throw new Error('Chat model is not set')
    }

    const id = randomString()
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
