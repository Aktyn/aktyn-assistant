/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */

import { notify } from 'node-notifier'

import { once } from '../utils/common'

import * as OpenAiAPI from './api/openai'
import { ChatStream } from './common'
import { mockChatStream } from './mock'

export enum AiProvider {
  OpenAI = 'openai',
}

function throwUnsupportedProviderError(provider: AiProvider) {
  throw new Error(`Unsupported AI provider: ${provider}`)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
class AI {
  private mockPaidRequests = false

  constructor(private readonly provider: AiProvider) {}

  setMockPaidRequests(mock: boolean) {
    this.mockPaidRequests = mock
  }

  //istanbul ignore next
  async getAvailableModels() {
    switch (this.provider) {
      case AiProvider.OpenAI:
        return await OpenAiAPI.getAvailableModels().then((models) =>
          models.map((model) => model.id),
        )
      default:
        throw throwUnsupportedProviderError(this.provider)
    }
  }

  async performChatQuery(query: string) {
    switch (this.provider) {
      case AiProvider.OpenAI: {
        const stream = this.mockPaidRequests
          ? mockChatStream((content) => ({
              choices: [{ delta: { content } }],
            }))
          : await OpenAiAPI.performChatQuery(query)
        return new ChatStream(async function* transformStream() {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta.content
            if (content) {
              yield { content, timestamp: Date.now() }
            }
          }
        }, stream.controller)
      }
      default:
        throw throwUnsupportedProviderError(this.provider)
    }
  }

  static notifyError(error: unknown) {
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
