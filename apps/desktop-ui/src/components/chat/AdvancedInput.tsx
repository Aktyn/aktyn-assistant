import {
  type DragEventHandler,
  useCallback,
  type ClipboardEventHandler,
  type KeyboardEventHandler,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'
import type { ChatMessage } from '@aktyn-assistant/common'
import { addFile, autoHeight, imageUrlToFile } from './helpers'

const maxInputLength = 2048

export type AdvancedInputHandle = {
  clear: () => void
  focus: () => void
  blur: () => void
}

export type AdvancedInputProps = {
  onSend: (contents: ChatMessage['contents']) => void
  disabled?: boolean
  textOnly?: boolean
}

export const AdvancedInput = forwardRef<
  AdvancedInputHandle,
  AdvancedInputProps
>(({ onSend, disabled = false, textOnly = false }, forwardRef) => {
  const inputRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    forwardRef,
    () => ({
      clear: () => {
        if (inputRef.current) {
          inputRef.current.innerText = ''
        }
      },
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }),
    [],
  )

  useEffect(() => {
    inputRef.current?.setAttribute('disabled', disabled.toString())
    inputRef.current?.setAttribute('readonly', disabled.toString())
    if (disabled) {
      inputRef.current?.blur()
    }
  }, [disabled])

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
        }
      } else {
        const selection = window.getSelection()

        if (text.startsWith('file://')) {
          if (textOnly) {
            return
          }
          const filePath = text.replace('file://', '')
          imageUrlToFile(filePath)
            .then((file) => addFile(file, event.currentTarget))
            .catch(console.error)
        } else {
          console.info('Pasted text:', text)
          selection?.getRangeAt(0).insertNode(document.createTextNode(text))
        }
      }
    },
    [textOnly],
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
        }
      }
    },
    [textOnly],
  )

  return (
    <div
      ref={inputRef}
      className="chat-input"
      contentEditable="true"
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    ></div>
  )
})
