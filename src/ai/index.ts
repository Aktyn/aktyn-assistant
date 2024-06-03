/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */

import { notify } from 'node-notifier'

import { once } from '../utils/common'

import * as OpenAiAPI from './api/openai'

enum AiProvider {
  OpenAI = 'openai',
}

function throwUnsupportedProviderError(provider: AiProvider) {
  throw new Error(`Unsupported AI provider: ${provider}`)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
class AI {
  constructor(private readonly provider: AiProvider) {}

  public async getAvailableModels() {
    switch (this.provider) {
      case AiProvider.OpenAI:
        return OpenAiAPI.getAvailableModels().then((models) => models.map((model) => model.id))
      default:
        throw throwUnsupportedProviderError(this.provider)
    }
  }

  public async performChatQuery() {
    switch (this.provider) {
      case AiProvider.OpenAI:
        return OpenAiAPI.performChatQuery()
      default:
        throw throwUnsupportedProviderError(this.provider)
    }
  }

  public static notifyError(error: unknown) {
    //TODO: display error message as system notification
    console.error(error)
    notify({
      title: 'AI error',
      message: error instanceof Error ? error.message : undefined,
    })
  }
}

export const getAiClient = once(() => {
  return new AI(AiProvider.OpenAI)
})

export function notifyAiError(error: unknown) {
  AI.notifyError(error)
}
