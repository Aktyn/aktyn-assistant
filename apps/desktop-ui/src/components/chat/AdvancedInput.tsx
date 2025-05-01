import {
  type DragEventHandler,
  useCallback,
  type ClipboardEventHandler,
  type KeyboardEventHandler,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  type FormEventHandler,
} from 'react'
import type { ChatMessage } from '@aktyn-assistant/common'
import { addFile, autoHeight, imageUrlToFile } from './helpers'
import { cn } from '@/lib/utils'

const maxInputLength = 2048

export type AdvancedInputHandle = {
  clear: () => void
  focus: () => void
  blur: () => void
}

export type AdvancedInputProps = {
  onSend: (contents: ChatMessage['contents']) => void
  loading?: boolean
  textOnly?: boolean
}

export const AdvancedInput = forwardRef<
  AdvancedInputHandle,
  AdvancedInputProps
>(({ onSend, loading = false, textOnly = false }, forwardRef) => {
  const inputRef = useRef<HTMLDivElement>(null)

  const handleUpdate = useCallback(
    (event: {
      currentTarget: Parameters<
        FormEventHandler<HTMLDivElement>
      >[0]['currentTarget']
    }) => {
      event.currentTarget.dataset.empty = String(
        !event.currentTarget.innerText.trim().length,
      )
    },
    [],
  )

  useImperativeHandle(
    forwardRef,
    () => ({
      clear: () => {
        if (inputRef.current) {
          inputRef.current.innerText = ''
          handleUpdate({ currentTarget: inputRef.current })
        }
      },
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }),
    [handleUpdate],
  )

  useEffect(() => {
    inputRef.current?.setAttribute('disabled', loading.toString())
    inputRef.current?.setAttribute('readonly', loading.toString())
    if (loading) {
      inputRef.current?.blur()
    }
  }, [loading])

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      const input = event.currentTarget
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        const nodes = Array.from(input.childNodes)
        if (!nodes.length || input.innerText?.trim().length > maxInputLength) {
          return
        }

        const contents = nodes.reduce(
          (acc, node) => {
            switch (node.nodeName) {
              case 'IMG':
                {
                  const imageData = (node as HTMLImageElement).src
                  if (imageData.match(/^data:image\/([^;]+);base64,/)) {
                    acc.push({
                      type: 'image',
                      imageData,
                    })
                  } else {
                    console.warn('Invalid image data:', imageData)
                  }
                }
                break
              case '#text':
                {
                  const content = node.textContent?.trim()
                  if (content) {
                    const last = acc.at(-1)
                    if (last && last.type === 'text') {
                      last.content += '\n' + content
                    } else {
                      acc.push({
                        type: 'text',
                        content,
                      })
                    }
                  }
                }
                break
            }
            return acc
          },
          [] as ChatMessage['contents'],
        )
        onSend(contents)
      }
      autoHeight(input)
    },
    [onSend],
  )

  const handlePaste = useCallback<ClipboardEventHandler<HTMLDivElement>>(
    (event) => {
      const clipboardData = event.clipboardData
      if (!clipboardData) {
        return
      }

      event.preventDefault()

      const text = clipboardData.getData('text/plain')
      const files = clipboardData.files
      if (files.length) {
        if (textOnly) {
          return
        }
        for (const file of files) {
          addFile(file, event.currentTarget).catch(console.error)
          handleUpdate({ currentTarget: event.currentTarget })
        }
      } else {
        const selection = window.getSelection()

        if (text.startsWith('file://')) {
          if (textOnly) {
            return
          }
          const filePath = text.replace('file://', '')
          imageUrlToFile(filePath)
            .then((file) => {
              const addFileResult = addFile(file, event.currentTarget)
              handleUpdate({ currentTarget: event.currentTarget })
              return addFileResult
            })
            .catch(console.error)
        } else {
          console.info('Pasted text:', text)
          selection?.getRangeAt(0).insertNode(document.createTextNode(text))
          handleUpdate({ currentTarget: event.currentTarget })
        }
      }
    },
    [handleUpdate, textOnly],
  )

  const handleDrop = useCallback<DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault()
      if (textOnly) {
        return
      }
      const files = event.dataTransfer?.files
      if (files?.length) {
        for (const file of files) {
          addFile(file, event.currentTarget).catch(console.error)
          handleUpdate({ currentTarget: event.currentTarget })
        }
      }
    },
    [handleUpdate, textOnly],
  )

  return (
    <div
      ref={inputRef}
      data-empty={true}
      className={cn(
        "outline-none size-full min-h-8 max-h-64 leading-8 px-2 resize-none overflow-y-auto overflow-x-hidden border-t rounded-none box-border focus-within:border-primary focus-within:bg-primary/10 transition-colors disabled:pointer-events-none before:content-['Type_your_message...'] before:text-muted-foreground before:inline-block before:size-0 before:text-nowrap before:pointer-events-none before:transition-opacity data-[empty=true]:before:opacity-50 data-[empty=false]:before:opacity-0 text-foreground **:[img]:inline **:[img]:mx-1 **:[img]:align-middle",
        loading && 'pointer-events-none data-[empty=true]:before:opacity-0',
      )}
      contentEditable="true"
      onInput={handleUpdate}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    ></div>
  )
})
