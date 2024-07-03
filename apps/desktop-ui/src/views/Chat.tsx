import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEventHandler,
} from 'react'
import { type ChatMessage } from '@aktyn-assistant/common'
import { mdiCursorMove, mdiLoading } from '@mdi/js'
import Icon from '@mdi/react'
import { cn } from '@nextui-org/react'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import anime from 'animejs'
import { Converter } from 'showdown'
import { v4 as uuidv4 } from 'uuid'
import {
  AdvancedInput,
  type AdvancedInputHandle,
  type AdvancedInputProps,
} from '../components/chat/AdvancedInput'
import { ChatMenu } from '../components/chat/ChatMenu'
import { GlassCard } from '../components/common/GlassCard'
import { useStateToRef } from '../hooks/useStateToRef'
import { useUserConfigValue } from '../hooks/useUserConfigValue'
import { format } from '../utils/contentFormatters'
import './chat.css'

type ChatProps = {
  in?: boolean
  quickChatMode?: boolean
}

export const Chat = ({ in: active, quickChatMode }: ChatProps) => {
  const inputRef = useRef<AdvancedInputHandle>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const activeAiMessageElementRef = useRef<HTMLDivElement | null>()
  const activeAiMessageBuffersRef = useRef(new Map<string, string>())
  const converterRef = useRef(
    new Converter({
      noHeaderId: true,
      smoothLivePreview: true,
      requireSpaceBeforeHeadingText: true,
      openLinksInNewWindow: true,
    }),
  )
  const scrollToBottomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listenersReadyRef = useRef(false)

  const [stickToBottom, setStickToBottom] = useState(true)
  const [conversationId, setConversationId] = useState(uuidv4())
  const [loading, setLoading] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [useHistory, setUseHistory, syncUseHistory] =
    useUserConfigValue('includeHistory')
  const [showRawResponse, setShowRawResponse, syncShowRawResponse] =
    useUserConfigValue('showRawResponse')

  useEffect(() => {
    if (active) {
      Promise.all([syncUseHistory(), syncShowRawResponse()]).catch(
        console.error,
      )
    }
  }, [active, syncShowRawResponse, syncUseHistory])

  useEffect(() => {
    if (!loading && active) {
      inputRef.current?.focus()
    }
  }, [active, loading])

  const scrollToBottom = useCallback(() => {
    if (scrollToBottomTimeoutRef.current) {
      return
    }

    scrollToBottomTimeoutRef.current = setTimeout(() => {
      if (active) {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
      scrollToBottomTimeoutRef.current = null
    }, 200)
  }, [active])

  const handleWheel = useCallback<WheelEventHandler<HTMLDivElement>>(
    (event) => {
      const output = event.currentTarget
      if (!output.childNodes.length) {
        return
      }
      const isScrollable =
        output.scrollHeight - output.scrollTop > output.clientHeight
      if (!isScrollable) {
        return
      }
      const isScrolledToBottom =
        Math.abs(
          output.scrollTop + output.clientHeight - output.scrollHeight,
        ) <= 2
      setStickToBottom(isScrolledToBottom)
    },
    [],
  )

  const sendChatMessage = useCallback(
    async (message: ChatMessage) => {
      if ((messagesContainerRef.current?.childNodes.length ?? 0) > 1) {
        const hr = document.createElement('hr')
        messagesContainerRef.current?.appendChild(hr)
      }

      const messageElement = document.createElement('div')
      messageElement.className = 'chat-message user'
      messageElement.append(
        ...message.contents.map((item: ChatMessage['contents'][number]) => {
          switch (item.type) {
            case 'text': {
              const span = document.createElement('span')
              span.innerText = item.content
              return span
            }
            case 'image': {
              const img = document.createElement('img')
              img.style.width = 'auto'
              img.style.maxWidth = '100%'
              img.style.maxHeight = '8rem'
              img.src = item.imageData
              return img
            }
          }
          throw new Error('Invalid message content type: ' + item)
        }),
      )

      messagesContainerRef.current?.appendChild(messageElement)
      messagesContainerRef.current?.classList.remove('empty')

      const model =
        await window.electronAPI.getUserConfigValue('selectedChatModel')
      if (!model) {
        throw new Error('Chat model is not set')
      }
      const id = uuidv4()

      const activeAiMessageElement = document.createElement('div')
      activeAiMessageElement.className = 'chat-message ai reset-tw'
      activeAiMessageElement.dataset.messageId = id

      activeAiMessageElementRef.current = activeAiMessageElement
      activeAiMessageBuffersRef.current.set(id, '')
      messagesContainerRef.current?.appendChild(
        activeAiMessageElementRef.current,
      )
      anime({
        targets: [messageElement, activeAiMessageElementRef.current],
        easing: 'spring(1, 80, 10, 0)',
        opacity: [0, 1],
        translateX: ['4rem', '0rem'],
        delay: anime.stagger(200, { from: 'first' }),
      })
      scrollToBottom()
      setStickToBottom(true)
      setLoading(true)
      setActiveMessageId(id)
      window.electronAPI.performChatQuery(message, model, id)
    },
    [scrollToBottom],
  )

  const handleSend = useCallback<AdvancedInputProps['onSend']>(
    (contents) => {
      sendChatMessage({
        conversationId,
        contents,
      }).catch(console.error)
      inputRef.current?.clear()
    },
    [sendChatMessage, conversationId],
  )

  const stickToBottomRef = useStateToRef(stickToBottom)
  const activeMessageIdRef = useStateToRef(activeMessageId)
  const conversationIdRef = useStateToRef(conversationId)
  const scrollToBottomRef = useStateToRef(scrollToBottom)
  const showRawResponseRef = useStateToRef(showRawResponse)
  useEffect(() => {
    let formatCodeBlocksTimeout: number | null = null
    if (listenersReadyRef.current) {
      return
    }
    listenersReadyRef.current = true

    converterRef.current.setFlavor('github')

    const formatResponse = (
      element: HTMLElement,
      messageId: string,
      debounce = true,
    ) => {
      if (showRawResponseRef.current) {
        element.innerText =
          activeAiMessageBuffersRef.current.get(messageId) ?? ''
        return
      }

      if (!debounce) {
        format(
          converterRef.current,
          element,
          activeAiMessageBuffersRef.current.get(messageId) ?? '',
        )
        return
      }

      if (formatCodeBlocksTimeout) {
        return
      }

      formatCodeBlocksTimeout = requestAnimationFrame(() => {
        format(
          converterRef.current,
          element,
          activeAiMessageBuffersRef.current.get(messageId) ?? '',
        )
        formatCodeBlocksTimeout = null
      })
    }

    window.electronAPI.onChatResponse((messageId, chunk) => {
      if (!activeMessageIdRef.current || !activeAiMessageElementRef.current) {
        console.warn('Received unexpected chat response', messageId)
        return
      }

      if (messageId !== activeMessageIdRef.current) {
        console.warn('Received chat response for unknown message', messageId)
        return
      }
      if (chunk.conversationId !== conversationIdRef.current) {
        console.warn(
          'Received chat response for unknown conversation',
          chunk.conversationId,
        )
        return
      }

      if (chunk.content) {
        const buffer = activeAiMessageBuffersRef.current.get(messageId) ?? ''
        activeAiMessageBuffersRef.current.set(messageId, buffer + chunk.content)

        if (stickToBottomRef.current) {
          scrollToBottomRef.current()
        }
        // if (chunk.content.includes('\n')) { //? Possible optimization
        formatResponse(activeAiMessageElementRef.current, messageId)
        // }
      }

      if (chunk.finished) {
        if (formatCodeBlocksTimeout !== null) {
          cancelAnimationFrame(formatCodeBlocksTimeout)
          formatCodeBlocksTimeout = null
        }
        formatResponse(activeAiMessageElementRef.current, messageId, false)
        setActiveMessageId(null)
        activeAiMessageElementRef.current = null
        setLoading(false)
      }
    })
  }, [
    activeMessageIdRef,
    conversationIdRef,
    scrollToBottomRef,
    stickToBottomRef,
    showRawResponseRef,
  ])

  const handleClearChat = useCallback(() => {
    if (!messagesContainerRef.current) {
      return
    }

    for (const child of [
      ...messagesContainerRef.current.querySelectorAll('.chat-message'),
      ...messagesContainerRef.current.querySelectorAll(':scope > hr'),
    ]) {
      child.remove()
    }
    messagesContainerRef.current.classList.add('empty')
    setActiveMessageId(null)
    setConversationId(uuidv4())
    activeAiMessageElementRef.current = null
    activeAiMessageBuffersRef.current.clear()
    setLoading(false)
    inputRef.current?.focus()
  }, [])

  const handleRawResponseToggle = useCallback(
    (on: boolean) => {
      setShowRawResponse(on)

      const messageContainers =
        messagesContainerRef.current?.querySelectorAll<HTMLDivElement>(
          '.chat-message.ai',
        ) ?? []
      for (const messageContainer of messageContainers) {
        const messageId = messageContainer.dataset.messageId
        if (!messageId) {
          console.warn('Message id not found in message container')
          continue
        }
        const rawContent =
          activeAiMessageBuffersRef.current.get(messageId) ?? ''

        if (on) {
          messageContainer.innerText = rawContent
        } else {
          messageContainer.innerHTML = converterRef.current.makeHtml(
            messageContainer.innerText,
          )

          format(converterRef.current, messageContainer, rawContent)
        }
      }
    },
    [setShowRawResponse],
  )

  return (
    <GlassCard
      className={cn(
        'chat-view border-b-0 rounded-b-none',
        quickChatMode && 'quick-chat-view',
      )}
    >
      <ScrollShadow
        orientation="vertical"
        size={60}
        ref={messagesContainerRef}
        className="chat-output empty"
        onWheel={handleWheel}
      />
      <ChatMenu
        showRawResponse={!!showRawResponse}
        setShowRawResponse={handleRawResponseToggle}
        useHistory={!!useHistory}
        setUseHistory={setUseHistory}
        onClearChat={handleClearChat}
      />
      <div className="chat-view-input-container">
        <AdvancedInput ref={inputRef} onSend={handleSend} disabled={loading} />
        <div className="chat-spinner" style={{ opacity: loading ? 1 : 0 }}>
          <Icon path={mdiLoading} spin size="1.5rem" />
        </div>
      </div>
      <div className="handle-container">
        <div className="handle">
          <Icon path={mdiCursorMove} size="1.5rem" />
          <span>Grab here to move the window</span>
        </div>
      </div>
    </GlassCard>
  )
}
