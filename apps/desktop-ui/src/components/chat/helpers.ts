import type { IconName } from 'lucide-react/dynamic'

export enum ChatMode {
  Assistant = 'assistant',
  ImageGeneration = 'image-generation',
}

export const chatModeProps: {
  [key in ChatMode]: { title: string; icon: IconName }
} = {
  [ChatMode.Assistant]: {
    title: 'Assistant',
    icon: 'messages-square',
  },
  [ChatMode.ImageGeneration]: {
    title: 'Image generation',
    icon: 'images',
  },
}

export function autoHeight(element: HTMLElement) {
  setTimeout(() => {
    element.style.height = '1px'
    element.style.height = `${element.scrollHeight + 0.5}px`
  }, 0)
}

export async function addFile(file: File, element: HTMLElement) {
  const buffer = await file.arrayBuffer()
  if (buffer.byteLength !== file.size) {
    throw new Error('File size mismatch')
  }

  const imageTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (buffer.byteLength === file.size && imageTypes.includes(file.type)) {
    await addImage(element, buffer, file.type)
  }
}

export async function addImage(
  element: HTMLElement,
  buffer: ArrayBuffer,
  type: string,
) {
  const imageUrl = await bufferToBase64(buffer, type)

  const preview = document.createElement('div')
  preview.style.position = 'fixed'
  preview.style.top = '0'
  preview.style.left = '0'
  preview.style.width = '100%'
  preview.style.height = '100%'
  preview.style.zIndex = '100'
  preview.style.display = 'flex'
  preview.style.flexDirection = 'column'
  preview.style.alignItems = 'center'
  preview.style.justifyContent = 'center'
  preview.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  preview.style.backdropFilter = 'blur(4px)'
  preview.style.animation = 'fade-in 0.2s ease-in-out'
  preview.onclick = () => {
    document.body.removeChild(preview)
  }

  const previewImg = document.createElement('img')
  previewImg.style.width = 'auto'
  previewImg.style.maxWidth = '100%'
  previewImg.style.maxHeight = '100%'
  previewImg.style.pointerEvents = 'none'
  previewImg.src = imageUrl
  preview.appendChild(previewImg)

  const image = document.createElement('img')
  image.style.width = 'auto'
  image.style.maxWidth = '100%'
  image.style.maxHeight = '2rem'
  image.style.cursor = 'pointer'
  image.src = imageUrl
  image.onclick = () => {
    document.body.appendChild(preview)
  }

  const selection = window.getSelection()
  if (selection) {
    const range = selection.getRangeAt(0)
    range.insertNode(image)
    range.collapse(false)
  } else {
    element.appendChild(image)
  }
}

function bufferToBase64(buffer: ArrayBuffer, type: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Invalid result'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(new Blob([buffer], { type }))
  })
}

export async function imageUrlToFile(imageUrl: string) {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image (status ${response.status})`)
    }
    const blob = await response.blob()
    const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1)
    const file = new File([blob], filename, { type: blob.type })
    return file
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
