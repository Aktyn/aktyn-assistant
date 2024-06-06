import type { ChatStream } from '../ai'
import type { UserConfigType } from '../types'

// eslint-disable-next-line @typescript-eslint/naming-convention
export type InterfaceAPI = {
  settings: {
    get: <Key extends keyof UserConfigType>(key: Key) => UserConfigType[Key]
    set: <Key extends keyof UserConfigType>(key: Key, value: UserConfigType[Key]) => void
  }
  ai: {
    sendChatMessage: (message: string) => Promise<InstanceType<typeof ChatStream>>
    requestChatModels: () => Promise<string[]>
  }
}
