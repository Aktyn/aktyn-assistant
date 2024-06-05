/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */

import { printError } from '@aktyn-assistant/terminal-interface'
import { notify } from 'node-notifier'

import { isDev } from '../utils/common'

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
export class AI {
  private static instance: AI | null = null

  private mockPaidRequests = false

  private constructor(private readonly provider: AiProvider) {}

  public static async client(provider?: AiProvider): Promise<AI> {
    if (!provider) {
      if (AI.instance) {
        return AI.instance
      } else {
        throw new Error(
          'No AI provider selected. First call to this method should specify desired provider.',
        )
      }
    }

    if (AI.instance && AI.instance.provider === provider) {
      return AI.instance
    }

    AI.instance = new AI(provider)

    switch (provider) {
      case AiProvider.OpenAI:
        await OpenAiAPI.getOpenAiClient()
        break
      default:
        throw throwUnsupportedProviderError(provider)
    }

    return AI.instance
  }

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

  async performChatQuery(query: string, model: string) {
    switch (this.provider) {
      case AiProvider.OpenAI: {
        const stream = this.mockPaidRequests
          ? mockChatStream((content) => ({
              choices: [{ delta: { content } }],
            }))
          : await OpenAiAPI.performChatQuery(query, model)
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

  static notifyError(error: unknown, title = 'AI error') {
    if (isDev()) {
      console.error(error)
    }

    const errorObject = {
      title,
      message: error instanceof Error ? error.message : undefined,
    }
    printError(errorObject)
    notify(errorObject)
  }
}
