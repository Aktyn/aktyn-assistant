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

export function bufferToBase64(buffer: ArrayBuffer, type: string) {
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
