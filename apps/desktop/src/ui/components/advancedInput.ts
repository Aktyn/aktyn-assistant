import { bufferToBase64, imageUrlToFile } from '../utils/common'
import { createElement } from '../utils/dom'

export class AdvancedInput {
  private _element: HTMLDivElement

  constructor(onSend: (contents: UiChatMessage['contents']) => void) {
    const autoHeight = (element: HTMLElement) => {
      setTimeout(() => {
        element.style.height = '1px'
        element.style.height = `${element.scrollHeight + 1}px`
      }, 0)
    }

    //TODO: drag and drop image feature
    const maxInputLength = 2048
    const input = createElement('div', {
      className: 'chat-input',
      postProcess: (editableElement) => {
        editableElement.contentEditable = 'true'

        editableElement.onkeydown = (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()

            const nodes = Array.from(input.childNodes)
            if (
              !nodes.length ||
              input.innerText?.trim().length > maxInputLength
            ) {
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
              [] as UiChatMessage['contents'],
            )
            onSend(contents)
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

          event.preventDefault()

          const text = clipboardData.getData('text/plain')
          const files = clipboardData.files
          if (files.length) {
            for (const file of files) {
              addFile(file).catch(console.error)
            }
          } else {
            const selection = window.getSelection()

            if (text.startsWith('file://')) {
              const filePath = text.replace('file://', '')
              imageUrlToFile(filePath).then(addFile).catch(console.error)
            } else {
              console.info('Pasted text:', text)
              selection?.getRangeAt(0).insertNode(document.createTextNode(text))
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
    this._element.setAttribute('readonly', disabled.toString())
    if (disabled) {
      this._element.blur()
    }
  }
}

async function addImage(
  element: HTMLElement,
  buffer: ArrayBuffer,
  type: string,
) {
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

  const selection = window.getSelection()
  if (selection) {
    const range = selection.getRangeAt(0)
    range.insertNode(image)
    range.collapse(false)
  } else {
    element.appendChild(image)
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
