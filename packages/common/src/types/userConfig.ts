import type { AiProvider } from '../ai'

export type UserConfigType = {
  selectedAiProvider: AiProvider | null
  selectedChatModel: string | null
  mockPaidRequests: boolean | null
}
