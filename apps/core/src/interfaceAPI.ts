import { type InterfaceAPI, assert } from '@aktyn-assistant/common'

import { AI } from './ai'
import { getUserConfigValue, setUserConfigValue } from './utils/user-config'

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getInterfaceAPI(ai: AI): InterfaceAPI {
  return {
    ai: {
      sendChatMessage: async (message) => {
        try {
          const chatModel = getUserConfigValue('selectedChatModel')
          assert(typeof chatModel === 'string', 'Chat model is not set')
          return await ai.performChatQuery(message, chatModel)
        } catch (error) {
          AI.notifyError(error, 'Performing chat query error')
          throw error
        }
      },
      requestChatModels: () => ai.getAvailableModels(),
    },
    settings: {
      get: getUserConfigValue,
      set: setUserConfigValue,
    },
  }
}
