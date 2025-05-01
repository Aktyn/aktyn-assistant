import {
  AdvancedInput,
  type AdvancedInputHandle,
  type AdvancedInputProps,
} from '@/components/chat/AdvancedInput'
import { ChatMenu } from '@/components/chat/ChatMenu'
import { ChatMode } from '@/components/chat/helpers'
import { GlassCard } from '@/components/common/GlassCard'
import { SpeechSynthesisIndicator } from '@/components/common/SpeechSynthesisIndicator'
import { useCancellablePromise } from '@/hooks/useCancellablePromise'
import { useStateToRef } from '@/hooks/useStateToRef'
import { useUserConfigValue } from '@/hooks/useUserConfigValue'
import { cn } from '@/lib/utils'
import { format } from '@/utils/contentFormatters'
import type { ChatMessage } from '@aktyn-assistant/common'
import type { ChatSource } from '@aktyn-assistant/core'
import { Loader2, MessagesSquare, Move } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type WheelEventHandler,
} from 'react'
import { Converter } from 'showdown'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { ScrollArea } from '../ui/scroll-area'

import './chat-message.css'
import './code-blocks.css'

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
        const container =
          getScrollAreaInnerContainer(messagesContainerRef)?.parentElement
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          })
        }
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
      const container = getScrollAreaInnerContainer(messagesContainerRef)
      if (!container) {
        return
      }
      if ((container.childNodes.length ?? 0) > 1) {
        const hr = document.createElement('hr')
        container.appendChild(hr)
      }

      const messageElement = document.createElement('div')
      messageElement.dataset.slot = 'user-message'
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

      container.appendChild(messageElement)
      container.classList.remove('empty')

      const activeAiMessageElement = document.createElement('div')
      activeAiMessageElement.className = 'reset-tw'
      activeAiMessageElement.dataset.slot = 'ai-message'
      activeAiMessageElement.dataset.messageId = id

      activeAiMessageElementRef.current = activeAiMessageElement
      activeAiMessageBuffersRef.current.set(id, '')
      container.appendChild(activeAiMessageElementRef.current)

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
    const container = getScrollAreaInnerContainer(messagesContainerRef)
    if (!container) {
      return
    }

    container.innerHTML = ''
    container.classList.add('empty')
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
        getScrollAreaInnerContainer(
          messagesContainerRef,
        )?.querySelectorAll<HTMLDivElement>('[data-slot="ai-message"]') ?? []
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
      data-slot={quickChatMode ? 'quick-chat-view' : 'chat-view'}
      className={cn(
        'relative py-0 grid grid-cols-1 grid-rows-[1fr_auto] gap-0',
        quickChatMode
          ? 'bg-background/95 border-2 border-primary/20 shadow-none size-[calc(100%-2px)] box-border max-w-none max-h-none text-shadow-[0_0_1px_#0004] justify-between overflow-hidden rounded-b-md'
          : 'h-[calc(100vh-var(--spacing)*4)] overflow-hidden mt-4 border-b-0 rounded-b-none',
        mode === ChatMode.ImageGeneration &&
          'border-gradient-secondary/20 bg-linear from-gradient-secondary/10 to-gradient-secondary/10',
        mode === ChatMode.ImageGeneration && quickChatMode && 'bg-background!',
      )}
    >
      <ScrollArea
        ref={messagesContainerRef}
        className={cn(
          'overflow-auto shadow-inner\
          **:data-[slot="scroll-area-viewport"]:*:pt-16\
          **:data-[slot="scroll-area-viewport"]:mask-t-from-[calc(100%-var(--spacing)*24)]\
          **:[hr]:border-border **:[hr]:my-2\
          \
          **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:content-["AI_responses_will_appear_here"]\
          **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:text-muted-foreground\
          **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:font-bold\
          **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:block\
          **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:text-center',

          quickChatMode &&
            'pt-0\
            **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:content-["Quick_chat_responses_will_appear_here"]\
            **:data-[slot="scroll-area-viewport"]:*:[.empty]:before:mt-0',
        )}
        onWheel={handleWheel}
        onClick={(event) => {
          if (event.currentTarget.children.length === 0) {
            inputRef.current?.focus()
          }
        }}
      />
      <div className="absolute right-16 top-4 h-8 z-10 flex flex-row items-center justify-end gap-x-2 text-sm text-muted-foreground">
        <MessagesSquare className="size-5" />
        <span>
          {mode === ChatMode.Assistant
            ? selectedChatModel
            : imageGenerationModel}
        </span>
        {mockPaidRequests && (
          <span className="text-xs text-orange-300">(mock)</span>
        )}
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
      <div className="mt-auto flex relative *:not-first:absolute *:not-first:inset-x-0 *:not-first:inset-y-0 *:not-first:my-auto *:not-first:h-auto *:not-first:transition-opacity *:not-first:pointer-events-none">
        <AdvancedInput
          ref={inputRef}
          onSend={handleSend}
          loading={loading}
          textOnly={mode === ChatMode.ImageGeneration}
        />
        <div
          className="left-0 right-auto w-fit h-full inline-flex items-center justify-start pointer-events-none p-2"
          style={{ opacity: loading ? 1 : 0 }}
        >
          <Loader2 className="animate-spin size-6" />
        </div>
        <div
          className="right-4 h-full flex items-center justify-end min-h-8"
          style={{ opacity: speakingConversationId ? 1 : 0 }}
        >
          <SpeechSynthesisIndicator
            active={!!speakingConversationId}
            onCancel={() => window.electronAPI.cancelSpeaking()}
          />
        </div>
      </div>
      {quickChatMode && (
        <div className="absolute top-0 inset-x-0 w-full pointer-events-none z-20">
          <div
            className="select-none flex items-center justify-center gap-x-2 color-foreground/25 border rounded-full mx-auto px-4 py-1 text-sm w-golden-reverse max-w-[calc(100%-4rem)] bg-background/50 cursor-pointer overflow-hidden whitespace-nowrap text-muted-foreground"
            style={{
              //@ts-expect-error webkit css property
              WebkitAppRegion: 'drag',
            }}
          >
            <Move className="size-5" />
            <span className="text-sm">Grab here to move the window</span>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function getScrollAreaInnerContainer(
  scrollAreaRef: RefObject<HTMLDivElement | null>,
) {
  const scrollArea = scrollAreaRef.current
  if (!scrollArea) {
    return null
  }
  return scrollArea.querySelector('[data-slot="scroll-area-viewport"]>div')
}
