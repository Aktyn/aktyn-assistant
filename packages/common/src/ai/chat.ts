export type ChatMessage = {
  conversationId: string
  contents: Array<
    | {
        type: 'text'
        content: string
      }
    | {
        type: 'image'
        imageData: string
      }
  >
}

export type ChatResponse = {
  conversationId: string
  content: string
  timestamp: number
  finished: boolean
  role: 'system' | 'user' | 'assistant' | 'tool' | null
}
