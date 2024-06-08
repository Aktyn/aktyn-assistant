/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */
import { Stream, assert, isDev, once, type ChatResponse } from '@aktyn-assistant/common'
import { notify } from 'node-notifier'
import { OpenAI } from 'openai'
import type { ChatCompletionChunk } from 'openai/resources/index.mjs'

import { getUserConfigValue } from '../user/user-config'

import {
  AiProviderType,
  loadProviderApiKey,
  removeProviderApiKey,
  saveProviderApiKey,
} from './api/common'
import * as OpenAiAPI from './api/openai'
import { mockChatStream } from './mock'

export { AiProviderType } from './api/common'

class UnsupportedProviderError extends Error {
  constructor(providerType: AiProviderType) {
    super(`Unsupported AI provider: ${providerType}`)
  }
}

function throwUnsupportedProviderError(provider: AiProviderType) {
  throw new UnsupportedProviderError(provider)
}

const AiProviderClass = {
  [AiProviderType.openai]: OpenAI,
} as const satisfies {
  [key in AiProviderType]: InstanceType<ObjectConstructor>
}

type GetProviderClass<ProviderType extends AiProviderType> = InstanceType<
  (typeof AiProviderClass)[ProviderType]
>

type InitType<ProviderType extends AiProviderType> = {
  providerType: ProviderType
  requestApiKey: (providerType: ProviderType, reason?: 'validation-failed') => Promise<string>
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class AI<ProviderType extends AiProviderType = AiProviderType> {
  private static instance: AI | null = null

  private constructor(
    private readonly providerType: ProviderType,
    private readonly providerClient: GetProviderClass<ProviderType>,
  ) {}

  private static async getProviderClient<ProviderType extends AiProviderType>(
    init: InitType<ProviderType>,
    previousAttemptFailed = false,
  ): Promise<GetProviderClass<ProviderType>> {
    try {
      let apiKey = loadProviderApiKey(init.providerType)
      while (!apiKey) {
        apiKey =
          (await init.requestApiKey(
            init.providerType,
            previousAttemptFailed ? 'validation-failed' : undefined,
          )) ?? ''
      }
      saveProviderApiKey(init.providerType, apiKey)

      try {
        switch (init.providerType) {
          case AiProviderType.openai:
            //@ts-expect-error Typescript reports type mismatch between return type of OpenAiAPI.getOpenAiClient and this function
            return await OpenAiAPI.getOpenAiClient(apiKey)
          default:
            throw throwUnsupportedProviderError(init.providerType)
        }
      } catch (error) {
        if (error instanceof UnsupportedProviderError) {
          throw error
        }

        if (isDev()) {
          console.error(error)
        }
        removeProviderApiKey(init.providerType)
        return await AI.getProviderClient(init, true)
      }
    } catch (error) {
      notify({
        title: 'OpenAI setup fatal error',
        message: error instanceof Error ? error.message : undefined,
      })
      console.error(error)
      process.exit(1)
    }
  }

  public static async client<ProviderType extends AiProviderType>(init?: InitType<ProviderType>) {
    if (!init) {
      if (AI.instance) {
        return AI.instance
      } else {
        throw new Error(
          'No AI provider selected. First call to this method should specify desired provider.',
        )
      }
    }

    if (AI.instance && AI.instance.providerType === init.providerType) {
      return AI.instance
    }

    const client = await AI.getProviderClient<ProviderType>(init)
    AI.instance = new AI<ProviderType>(init.providerType, client)

    return AI.instance
  }

  //istanbul ignore next
  getAvailableModels = once(async () => {
    switch (this.providerType) {
      case AiProviderType.openai:
        return await OpenAiAPI.getAvailableModels(this.providerClient).then((models) =>
          models.map((model) => model.id),
        )
      default:
        throw throwUnsupportedProviderError(this.providerType)
    }
  })

  async performChatQuery(query: string, model: string) {
    const mockPaidRequests = getUserConfigValue('mockPaidRequests')
    assert(typeof mockPaidRequests === 'boolean', 'Mock paid requests is not set')

    switch (this.providerType) {
      case AiProviderType.openai: {
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
          : await OpenAiAPI.performChatQuery(this.providerClient, query, model)

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
        throw throwUnsupportedProviderError(this.providerType)
    }
  }

  notifyError(error: unknown, title = `AI error (${this.providerType}`) {
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
