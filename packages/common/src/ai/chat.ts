export type ChatMessage =
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'image'
      imageData: string
    }

export type ChatResponse = {
  content: string
  timestamp: number
  finished: boolean
  role: 'system' | 'user' | 'assistant' | 'tool' | null
}
