import type { ChatResponse } from '../ai'
import type { UserConfigType } from '../types'
import type { Stream } from '../utils/stream'

// eslint-disable-next-line @typescript-eslint/naming-convention
export type InterfaceAPI = {
  settings: {
    get: <Key extends keyof UserConfigType>(key: Key) => UserConfigType[Key]
    set: <Key extends keyof UserConfigType>(key: Key, value: UserConfigType[Key]) => void
  }
  ai: {
    sendChatMessage: (message: string) => Promise<InstanceType<typeof Stream<ChatResponse>>>
    requestChatModels: () => Promise<string[]>
  }
}
