export type ChatResponse = {
  content: string
  timestamp: number
  finished: boolean
  role: 'system' | 'user' | 'assistant' | 'tool' | null
}
