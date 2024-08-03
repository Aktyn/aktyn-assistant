import { assert, type ChatMessage } from '@aktyn-assistant/common'
import { getUserConfigValue, type AI } from '@aktyn-assistant/core'

export enum INTERFACE_VIEW {
  Chat = 'chat',
  VoiceChat = 'voice-chat',
  Tools = 'tools',
  Settings = 'settings',
  Info = 'info',
}

export abstract class View {
  constructor(
    public readonly type: INTERFACE_VIEW,
    protected readonly handleError: (error: unknown) => void,
    protected readonly onReturnToMenu: () => void,
    protected readonly ai: AI,
  ) {}

  abstract abortAsynchronousActions(): void
  abstract open(): void

  protected async sendChatMessage(message: ChatMessage) {
    try {
      const chatModel = getUserConfigValue('selectedChatModel')
      assert(typeof chatModel === 'string', 'Chat model is not set')
      return await this.ai.performChatQuery(
        message,
        { model: chatModel },
        'regular',
      )
    } catch (error) {
      this.ai.notifyError(error, 'Performing chat query error')
      throw error
    }
  }
  protected cancelSpeaking() {
    this.ai.cancelSpeaking()
  }
}
