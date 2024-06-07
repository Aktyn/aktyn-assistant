/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */
import { Stream, assert, isDev, type ChatResponse } from '@aktyn-assistant/common'
import { notify } from 'node-notifier'
import type { ChatCompletionChunk } from 'openai/resources/index.mjs'

import { getUserConfigValue } from '../user/user-config'

import * as OpenAiAPI from './api/openai'
import { mockChatStream } from './mock'

function throwUnsupportedProviderError(provider: AiProvider) {
  throw new Error(`Unsupported AI provider: ${provider}`)
}

export enum AiProvider {
  OpenAI = 'openai',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class AI {
  private static instance: AI | null = null

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
    const mockPaidRequests = getUserConfigValue('mockPaidRequests')
    assert(typeof mockPaidRequests === 'boolean', 'Mock paid requests is not set')

    switch (this.provider) {
      case AiProvider.OpenAI: {
        const stream = mockPaidRequests
          ? mockChatStream(
              (content, isLast): ChatCompletionChunk => ({
                id: Math.random().toString(36).substring(2),
                choices: [
                  {
                    index: 0,
                    delta: {
                      content,
                      role: 'assistant',
                      //tool_calls: []
                    },
                    finish_reason: isLast ? 'stop' : null,
                  },
                ],
                created: Date.now(),
                model,
                object: 'chat.completion.chunk',
              }),
            )
          : await OpenAiAPI.performChatQuery(query, model)

        const timeout = setTimeout(() => {
          stream.controller.abort('Timeout')
        }, 60_000)
        return new Stream<ChatResponse>(async function* transformStream() {
          for await (const chunk of stream) {
            const choice = chunk.choices.at(0)
            if (choice && !stream.controller.signal.aborted) {
              yield {
                content: choice.delta.content ?? '',
                timestamp: Date.now(),
                finished: !!choice.finish_reason,
                role: choice.delta.role ?? null,
              } satisfies ChatResponse
            }
          }
          clearTimeout(timeout)
        }, stream.controller)
      }
      default:
        throw throwUnsupportedProviderError(this.provider)
    }
  }

  notifyError(error: unknown, title = `AI error (${this.provider}`) {
    AI.notifyError(error, title)
  }

  static notifyError(error: unknown, title = 'AI error') {
    if (isDev()) {
      console.error(error)
    }

    const errorObject = {
      title,
      message: error instanceof Error ? error.message : undefined,
    }
    notify(errorObject)
  }
}
