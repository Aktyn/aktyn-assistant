import { bufferToBase64, imageUrlToFile } from '../utils/common'
import { createElement } from '../utils/dom'

export class AdvancedInput {
  private _element: HTMLDivElement

  constructor(onSend: (content: UiChatMessage[]) => void) {
    const autoHeight = (element: HTMLElement) => {
      setTimeout(() => {
        element.style.height = '1px'
        element.style.height = `${element.scrollHeight + 1}px`
      }, 0)
    }

    const addImage = async (
      element: HTMLElement,
      buffer: ArrayBuffer,
      type: string,
    ) => {
      const imageUrl = await bufferToBase64(buffer, type)

      const preview = createElement('div', {
        content: createElement('img', {
          style: {
            width: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            pointerEvents: 'none',
          },
          postProcess: (img) => {
            img.src = imageUrl
          },
        }),
        style: {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: '100',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 0.2s ease-in-out',
        },
        postProcess: (div) => {
          div.onclick = () => {
            document.body.removeChild(div)
          }
        },
      })

      const image = createElement('img', {
        style: {
          width: 'auto',
          maxWidth: '100%',
          maxHeight: '2rem',
          cursor: 'pointer',
        },
        postProcess: (img) => {
          img.src = imageUrl
          img.onclick = () => {
            document.body.appendChild(preview)
          }
        },
      })

      element.appendChild(image)

      const range = document.createRange()
      range.selectNodeContents(element)
      range.collapse(false)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }

    //TODO: drag and drop image feature
    const input = createElement('div', {
      className: 'chat-input',
      postProcess: (editableElement) => {
        editableElement.contentEditable = 'true'

        editableElement.onkeydown = (event) => {
          if (input.innerText?.trim().length > 2048) {
            event.preventDefault()
            return
          }

          if (event.key === 'Enter' && !event.shiftKey) {
            const nodes = Array.from(input.childNodes)
            if (!nodes.length) {
              return
            }

            event.preventDefault()
            const message = nodes.reduce((acc, node) => {
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
            }, [] as UiChatMessage[])
            onSend(message)
          }
          autoHeight(editableElement)
        }

        editableElement.onpaste = (event) => {
          const addFile = async (file: File) => {
            const buffer = await file.arrayBuffer()
            if (buffer.byteLength !== file.size) {
              throw new Error('File size mismatch')
            }

            const imageTypes = ['image/png', 'image/jpeg', 'image/webp']
            if (
              buffer.byteLength === file.size &&
              imageTypes.includes(file.type)
            ) {
              await addImage(editableElement, buffer, file.type)
            }
          }

          const clipboardData = event.clipboardData
          if (!clipboardData) {
            return
          }

          const text = clipboardData.getData('text/plain')
          const files = clipboardData.files
          if (files.length) {
            for (const file of files) {
              addFile(file).catch(console.error)
            }
            event.preventDefault()
          } else {
            if (text.startsWith('file://')) {
              const filePath = text.replace('file://', '')
              imageUrlToFile(filePath).then(addFile).catch(console.error)
              event.preventDefault()
            } else {
              console.info('Pasted text:', text)
            }
          }
        }
      },
    })

    this._element = input
  }

  get element() {
    return this._element
  }

  public clear() {
    this._element.innerText = ''
  }

  public focus() {
    this._element.focus()
  }

  public setDisabled(disabled: boolean) {
    this._element.setAttribute('disabled', disabled.toString())
  }
}

//TODO: paste images into caret position and move the caret to the right of pasted image
// function getCaretPosition(element: HTMLElement) {
//   const selection = document.getSelection()
//   if (!selection || !element) {
//     return 0
//   }
//   selection.collapseToEnd()
//   const range = selection.getRangeAt(0)
//   const clone = range.cloneRange()
//   clone.selectNodeContents(element)
//   clone.setEnd(range.startContainer, range.startOffset)
//   return clone.toString().length
// }
