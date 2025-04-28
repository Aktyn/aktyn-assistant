/**
 * This file specifies the general interface for the AI client.
 * Logic and types specific to any AI API (eg. OpenAI) should not be used outside its corresponding file.
 */
import {
  once,
  Stream,
  type ChatMessage,
  type ChatResponse,
  type Tool,
} from '@aktyn-assistant/common'
import { notify } from 'node-notifier'
import { AuthenticationError, type OpenAI } from 'openai'

import { BufferedSpeech } from '../audio'
import { getUserConfigValue } from '../user/user-config'
import { logger } from '../utils'

import {
  AiProviderType,
  deleteApiKey,
  loadProviderApiKey,
  saveProviderApiKey,
} from './api/common'
import * as OpenAiAPI from './api/openai'
import { mockChatStream } from './chatMock'
import { MOCKED_BASE64_IMAGE } from './imageMock'
import {
  getActiveTools,
  omitTools,
  type ChatSource,
  type ToolInfo,
} from './tools'

export { AiProviderType } from './api/common'
export {
  addToolsSource,
  editTool,
  loadToolsInfo,
  removeTool,
  setEnabledTools,
  type BuiltInToolInfo,
  type ChatSource,
  type ImportedToolInfo,
  type ToolInfo,
  type ToolsSourceData,
} from './tools'

class UnsupportedProviderError extends Error {
  constructor(providerType: AiProviderType) {
    super(`Unsupported AI provider: ${providerType}`)
  }
}

function throwUnsupportedProviderError(provider: AiProviderType) {
  throw new UnsupportedProviderError(provider)
}

type AiProviderClasses = {
  [key in AiProviderType]: OpenAI
}

type InitType<ProviderType extends AiProviderType> = {
  providerType: ProviderType
  requestApiKey: (
    providerType: ProviderType,
    reason?: 'validation-failed',
  ) => Promise<string>
}

export class AI<ProviderType extends AiProviderType = AiProviderType> {
  private static instance: AI | null = null

  private constructor(
    private readonly providerType: ProviderType,
    private readonly providerClient: AiProviderClasses[ProviderType],
  ) {
    this.loadTools()
  }

  private static async getProviderClient<ProviderType extends AiProviderType>(
    init: InitType<ProviderType>,
    previousAttemptFailed = false,
  ): Promise<AiProviderClasses[ProviderType]> {
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
          case AiProviderType.OpenAI:
            return await OpenAiAPI.getOpenAiClient(apiKey)
          default:
            throw throwUnsupportedProviderError(init.providerType)
        }
      } catch (error) {
        if (error instanceof UnsupportedProviderError) {
          throw error
        }

        if (error instanceof AuthenticationError) {
          deleteApiKey(init.providerType)
        }

        logger.error(error)
        //TODO: await few seconds and send false as second argument when this exception was caused by network error
        return await AI.getProviderClient(init, true)
      }
    } catch (error) {
      notify({
        title: 'OpenAI setup fatal error',
        message: error instanceof Error ? error.message : undefined,
      })
      logger.error(error)
      process.exit(1)
    }
  }

  public static async client<ProviderType extends AiProviderType>(
    init?: InitType<ProviderType>,
  ) {
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

  // --------------------------------------------------------------------------------

  private tools: Array<Tool & ToolInfo> = []
  private recentSpeech: BufferedSpeech | null = null

  public cancelSpeaking() {
    if (this.recentSpeech) {
      this.recentSpeech.abort()
      this.recentSpeech = null
    }
  }

  public loadTools() {
    this.tools = getActiveTools()
    if (this.tools.length) {
      const plural = this.tools.length === 1 ? '' : 's'
      logger.info(
        `Loaded ${this.tools.length} tool${plural ? 's' : ''}: ${this.tools.map((tool) => tool.schema.functionName).join(', ')}`,
      )
    } else {
      logger.info('No tools loaded')
    }
  }

  //istanbul ignore next
  getAvailableModels = once(async () => {
    switch (this.providerType) {
      case AiProviderType.OpenAI:
        return await OpenAiAPI.getAvailableModels(this.providerClient).then(
          (models) =>
            Object.keys(models).reduce(
              (acc, key) => {
                return {
                  ...acc,
                  [key]: models[key as keyof typeof models]
                    .map((model) => model.id)
                    .sort((a, b) => b.localeCompare(a)),
                }
              },
              {} as Record<keyof typeof models, string[]>,
            ),
        )
      default:
        throw throwUnsupportedProviderError(this.providerType)
    }
  })

  async performChatQuery(
    message: ChatMessage,
    options: {
      model: string
      onSpeaking?: (finished: boolean) => void
      ignoreHistory?: boolean
    },
    source: ChatSource,
  ) {
    const mockPaidRequests = getUserConfigValue('mockPaidRequests')

    const useHistory = getUserConfigValue('includeHistory')
    const maxChatHistoryLength = getUserConfigValue('maxChatHistoryLength') ?? 8
    const readChatResponses = getUserConfigValue('readChatResponses')
    const initialSystemMessage = getUserConfigValue('initialSystemMessage')

    switch (this.providerType) {
      case AiProviderType.OpenAI: {
        const stream = mockPaidRequests
          ? mockChatStream(
              (content, isLast): OpenAI.ChatCompletionChunk.Choice => ({
                index: 0,
                delta: {
                  content,
                  role: 'assistant',
                },
                finish_reason: isLast ? 'stop' : null,
              }),
            )
          : await OpenAiAPI.performChatQuery(this.providerClient, {
              message,
              model: options.model,
              tools: omitTools(this.tools, source),
              numberOfPreviousMessagesToInclude:
                useHistory && !options.ignoreHistory ? maxChatHistoryLength : 0,
              initialSystemMessage,
            })

        const timeout = setTimeout(() => {
          stream.controller.abort('Timeout')
        }, 60_000)

        this.recentSpeech?.abort()
        const speech = readChatResponses
          ? new BufferedSpeech(options.onSpeaking)
          : null
        this.recentSpeech = speech

        speech?.controller.signal.addEventListener('abort', () => {
          options.onSpeaking?.(true)
        })

        return new Stream<ChatResponse>(async function* transformStream() {
          for await (const choice of stream) {
            if (stream.controller.signal.aborted) {
              speech?.abort()
              break
            }

            const content = choice.delta.content ?? ''
            speech?.append(content)

            yield {
              conversationId: message.conversationId,
              content,
              timestamp: Date.now(),
              finished: !!choice.finish_reason,
              role: choice.delta.role ?? null,
            } satisfies ChatResponse
          }

          speech?.finalize()
          clearTimeout(timeout)
        }, stream.controller)
      }
      default:
        throw throwUnsupportedProviderError(this.providerType)
    }
  }

  async generateImage(query: string, options: { model: string }) {
    const mockPaidRequests = getUserConfigValue('mockPaidRequests')

    switch (this.providerType) {
      case AiProviderType.OpenAI:
        if (mockPaidRequests) {
          return MOCKED_BASE64_IMAGE
        }

        return await OpenAiAPI.generateImage(this.providerClient, {
          prompt: query,
          model: options.model,
        })
      default:
        throw throwUnsupportedProviderError(this.providerType)
    }
  }

  notifyError(error: unknown, title = `AI error (${this.providerType}`) {
    AI.notifyError(error, title)
  }

  static notifyError(error: unknown, title?: string) {
    logger.error(error)

    try {
      notify({
        title:
          title ??
          (AI.instance ? `AI error (${AI.instance.providerType})` : 'AI error'),
        message: error instanceof Error ? error.message : undefined,
      })
    } catch (error) {
      logger.error(error)
    }
  }
}
