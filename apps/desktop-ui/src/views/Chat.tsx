import { cn } from '@/lib/utils'
import type { ChatMessage } from '@aktyn-assistant/common'
import type { ChatSource } from '@aktyn-assistant/core'
import { Loader2, MoveHorizontal } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEventHandler,
} from 'react'
import { Converter } from 'showdown'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  AdvancedInput,
  type AdvancedInputHandle,
  type AdvancedInputProps,
} from '../components/chat/AdvancedInput'
import { ChatMenu } from '../components/chat/ChatMenu'
import { ChatMode } from '../components/chat/helpers'
import { GlassCard } from '../components/common/GlassCard'
import { SpeechSynthesisIndicator } from '../components/common/SpeechSynthesisIndicator'
import { useCancellablePromise } from '../hooks/useCancellablePromise'
import { useStateToRef } from '../hooks/useStateToRef'
import { useUserConfigValue } from '../hooks/useUserConfigValue'
import { format } from '../utils/contentFormatters'

type ChatProps = {
  in?: boolean
  quickChatMode?: boolean
}

export const Chat = ({ in: active, quickChatMode }: ChatProps) => {
  const inputRef = useRef<AdvancedInputHandle>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const activeAiMessageElementRef = useRef<HTMLDivElement>(null)
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
  const cancellable = useCancellablePromise()

  const [mode, setMode] = useState(ChatMode.Assistant)
  const [stickToBottom, setStickToBottom] = useState(true)
  const [conversationId, setConversationId] = useState(uuidv4())
  const [loading, setLoading] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [speakingConversationId, setSpeakingConversationId] = useState<
    string | null
  >(null)
  const [useHistory, setUseHistory, syncUseHistory] =
    useUserConfigValue('includeHistory')
  const [showRawResponse, setShowRawResponse, syncShowRawResponse] =
    useUserConfigValue('showRawResponse')
  const [readChatResponses, setReadChatResponses, syncReadChatResponses] =
    useUserConfigValue('readChatResponses')
  const [selectedChatModel, , syncSelectedChatModel] =
    useUserConfigValue('selectedChatModel')
  const [imageGenerationModel, , syncImageGenerationModel] = useUserConfigValue(
    'selectedImageGenerationModel',
  )
  const [mockPaidRequests, , syncMockPaidRequests] =
    useUserConfigValue('mockPaidRequests')

  useEffect(() => {
    if (active) {
      Promise.all([
        syncUseHistory(),
        syncShowRawResponse(),
        syncReadChatResponses(),
        syncSelectedChatModel(),
        syncImageGenerationModel(),
        syncMockPaidRequests(),
      ]).catch(console.error)
    }
  }, [
    active,
    syncMockPaidRequests,
    syncReadChatResponses,
    syncSelectedChatModel,
    syncImageGenerationModel,
    syncShowRawResponse,
    syncUseHistory,
  ])

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
    (event: React.WheelEvent<HTMLDivElement>) => {
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

  const sendMessageBase = useCallback(
    (message: ChatMessage, id: string) => {
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

      const activeAiMessageElement = document.createElement('div')
      activeAiMessageElement.className = 'chat-message ai reset-tw'
      activeAiMessageElement.dataset.messageId = id

      activeAiMessageElementRef.current = activeAiMessageElement
      activeAiMessageBuffersRef.current.set(id, '')
      messagesContainerRef.current?.appendChild(
        activeAiMessageElementRef.current,
      )
      //TODO: Add animation
      // anime({
      //   targets: [messageElement, activeAiMessageElementRef.current],
      //   easing: 'spring(1, 80, 10, 0)',
      //   opacity: [0, 1],
      //   translateX: ['4rem', '0rem'],
      //   delay: anime.stagger(200, { from: 'first' }),
      // })
      scrollToBottom()
      setStickToBottom(true)
      setLoading(true)
      setActiveMessageId(id)
    },
    [scrollToBottom],
  )

  const sendChatMessage = useCallback(
    async (message: ChatMessage, source: ChatSource, ignoreHistory = false) => {
      const model =
        await window.electronAPI.getUserConfigValue('selectedChatModel')
      if (!model) {
        throw new Error('Chat model is not set')
      }

      const id = uuidv4()
      sendMessageBase(message, id)
      window.electronAPI.performChatQuery(
        message,
        model,
        id,
        source,
        ignoreHistory,
      )
    },
    [sendMessageBase],
  )

  const stickToBottomRef = useStateToRef(stickToBottom)
  const activeMessageIdRef = useStateToRef(activeMessageId)
  const scrollToBottomRef = useStateToRef(scrollToBottom)

  const sendImageGenerationMessage = useCallback(
    async (message: ChatMessage) => {
      const model = await window.electronAPI.getUserConfigValue(
        'selectedImageGenerationModel',
      )
      if (!model) {
        throw new Error('Image generation model is not set')
      }

      const id = uuidv4()
      sendMessageBase(message, id)

      const imageGenerationQuery = message.contents.reduce(
        (acc, contentItem) =>
          contentItem.type === 'text' ? acc + contentItem.content : acc,
        '',
      )

      cancellable(window.electronAPI.generateImage(imageGenerationQuery, model))
        .then((imageData) => {
          if (
            !activeMessageIdRef.current ||
            !activeAiMessageElementRef.current
          ) {
            console.warn('Received unexpected chat response', id)
            return
          }
          if (activeMessageIdRef.current !== id) {
            console.warn('Received unexpected image generation response', id)
            return
          }

          const container = document.createElement('div')
          container.className = 'image-generation-container'

          const image = document.createElement('img')
          const imgSrc = `data:image/png;base64,${imageData}`
          image.src = imgSrc
          image.style.maxWidth = '100%'
          image.style.width = 'auto'
          image.style.height = 'auto'
          container.appendChild(image)

          const downloadButton = document.createElement('button')
          downloadButton.className = 'image-generation-download-button'
          downloadButton.onclick = () => {
            const a = document.createElement('a')
            a.href = imgSrc
            a.setAttribute('download', 'image.png')
            a.click()
          }
          container.appendChild(downloadButton)

          const downloadIcon = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          )
          downloadIcon.setAttributeNS(
            'http://www.w3.org/2000/svg',
            'viewBox',
            '0 0 24 24',
          )
          downloadIcon.style.width = '24'
          downloadIcon.style.height = '24'

          const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          )
          // path.setAttributeNS(null, 'd', mdiDownload) //TODO: refactor to use lucide-react

          downloadIcon.appendChild(path)
          downloadButton.appendChild(downloadIcon)

          activeAiMessageElementRef.current.appendChild(container)

          if (stickToBottomRef.current) {
            scrollToBottomRef.current()
          }

          setActiveMessageId(null)
          activeAiMessageElementRef.current = null
          setLoading(false)
        })
        .catch((error) => {
          if (error) {
            toast.error(error instanceof Error ? error.message : String(error))
          }
        })
    },
    [
      activeMessageIdRef,
      cancellable,
      scrollToBottomRef,
      sendMessageBase,
      stickToBottomRef,
    ],
  )

  const handleSend = useCallback<AdvancedInputProps['onSend']>(
    (contents) => {
      inputRef.current?.clear()
      if (mode === ChatMode.Assistant) {
        sendChatMessage(
          {
            conversationId,
            contents,
          },
          quickChatMode ? 'quick-chat' : 'regular',
        ).catch(console.error)
      } else {
        sendImageGenerationMessage({
          conversationId,
          contents,
        }).catch(console.error)
      }
    },
    [
      mode,
      sendChatMessage,
      conversationId,
      quickChatMode,
      sendImageGenerationMessage,
    ],
  )

  const conversationIdRef = useStateToRef(conversationId)
  const showRawResponseRef = useStateToRef(showRawResponse)
  const sendChatMessageRef = useStateToRef(sendChatMessage)
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

    window.electronAPI.onSpeakingState(
      (conversationId, _messageId, finished) => {
        setSpeakingConversationId(finished ? null : conversationId)
      },
    )

    window.electronAPI.onExternalCommand(
      (commandContent, source, ignoreHistory = false) => {
        setMode(ChatMode.Assistant)
        window.electronAPI.cancelSpeaking()

        sendChatMessageRef
          .current(
            {
              conversationId: conversationIdRef.current,
              contents: [{ type: 'text', content: commandContent }],
            },
            source,
            ignoreHistory,
          )
          .catch(console.error)
      },
    )
  }, [
    activeMessageIdRef,
    conversationIdRef,
    scrollToBottomRef,
    stickToBottomRef,
    showRawResponseRef,
    sendChatMessageRef,
  ])

  const handleClearChat = useCallback((focusInput = true) => {
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
    if (focusInput) {
      inputRef.current?.focus()
    }
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

  useEffect(() => {
    if (mode) {
      handleClearChat(false)
      window.electronAPI.cancelSpeaking()
    }
  }, [handleClearChat, mode])

  return (
    <GlassCard
      className={cn(
        'chat-view border-b-0',
        quickChatMode && 'quick-chat-view',
        mode,
      )}
    >
      <div
        ref={messagesContainerRef}
        className="chat-output empty overflow-auto shadow-inner"
        onWheel={handleWheel}
        onClick={(event) => {
          if (event.currentTarget.children.length === 0) {
            inputRef.current?.focus()
          }
        }}
      />
      <div className="small-info flex flex-row items-center gap-x-2 text-sm text-foreground-600">
        <MoveHorizontal size={20} />
        <span>
          {mode === ChatMode.Assistant
            ? selectedChatModel
            : imageGenerationModel}
        </span>
        {mockPaidRequests && <span className="text-xs">(mock)</span>}
      </div>
      <ChatMenu
        mode={mode}
        setMode={setMode}
        showRawResponse={!!showRawResponse}
        setShowRawResponse={handleRawResponseToggle}
        useHistory={!!useHistory}
        setUseHistory={setUseHistory}
        readChatResponses={!!readChatResponses}
        setReadChatResponses={setReadChatResponses}
        onClearChat={handleClearChat}
      />
      <div className="chat-view-input-container">
        <AdvancedInput
          ref={inputRef}
          onSend={handleSend}
          disabled={loading}
          textOnly={mode === ChatMode.ImageGeneration}
        />
        <div className="chat-spinner" style={{ opacity: loading ? 1 : 0 }}>
          <Loader2 className="animate-spin" size={24} />
        </div>
        <div
          className="chat-speaking-indicator"
          style={{ opacity: speakingConversationId ? 1 : 0 }}
        >
          <SpeechSynthesisIndicator
            active={!!speakingConversationId}
            onCancel={() => window.electronAPI.cancelSpeaking()}
          />
        </div>
      </div>
      <div className="handle-container">
        <div className="handle">
          <MoveHorizontal size={24} />
          <span>Grab here to move the window</span>
        </div>
      </div>
    </GlassCard>
  )
}
