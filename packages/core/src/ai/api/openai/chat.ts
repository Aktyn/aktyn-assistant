import { isDev, type ChatMessage } from '@aktyn-assistant/common'
import type { OpenAI } from 'openai'
import { Stream } from 'openai/streaming'

import { OPEN_AI_TOOLS, tryCallToolFunction } from './tool'

type Choice = OpenAI.ChatCompletionChunk.Choice

function appendToToolCalls(
  targetToolCalls: Required<Choice['delta']>['tool_calls'] | null,
  toolCallsToAppend: Required<Choice['delta']>['tool_calls'],
) {
  if (!targetToolCalls) {
    return toolCallsToAppend
  }

  if (toolCallsToAppend.length === targetToolCalls.length) {
    for (let i = 0; i < targetToolCalls.length; i++) {
      const targetToolCall = targetToolCalls[i]
      const partialToolCall = toolCallsToAppend[i]

      if (
        targetToolCall.index !== partialToolCall.index ||
        !targetToolCall.function ||
        !partialToolCall.function?.arguments
      ) {
        continue
      }

      targetToolCall.function.arguments ??= ''
      targetToolCall.function.arguments += partialToolCall.function.arguments
    }
  }

  return targetToolCalls
}

function areToolCallsCompleted(
  toolCalls:
    | Required<Choice['delta']>['tool_calls']
    | OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
    | null,
): toolCalls is OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] {
  if (!toolCalls) {
    return false
  }

  for (const toolCall of toolCalls) {
    if (
      !toolCall.id ||
      !toolCall.type ||
      !toolCall.function?.name ||
      !toolCall.function?.arguments
    ) {
      return false
    }
  }

  return true
}

//istanbul ignore next
export async function performChatQuery(
  client: OpenAI,
  content: string | ChatMessage[],
  model: string,
) {
  /** NOTE: this should contain conversation history in order for AI to remember previous responses */
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    typeof content === 'string'
      ? [{ role: 'user', content }]
      : [
          {
            role: 'user',
            content:
              content.map<OpenAI.Chat.Completions.ChatCompletionContentPart>(
                (item) => {
                  switch (item.type) {
                    case 'text':
                      return {
                        type: 'text',
                        text: item.content,
                      }
                    case 'image':
                      return {
                        type: 'image_url',
                        image_url: {
                          url: item.imageData,
                          detail: 'auto',
                        },
                      }
                  }
                },
              ),
          },
        ]

  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    tools: OPEN_AI_TOOLS,
    tool_choice: 'auto',
  })

  return new Stream<Choice | undefined>(async function* transformStream() {
    let toolCalls: Required<Choice['delta']>['tool_calls'] | null = null

    for await (const chunk of stream) {
      if (stream.controller.signal.aborted) {
        break
      }

      const choice = chunk.choices.at(0)

      try {
        if (choice?.delta.tool_calls?.length) {
          toolCalls = appendToToolCalls(toolCalls, choice.delta.tool_calls)
        }
      } catch (error) {
        console.error('Error while processing tool calls', error)
      }

      if (!choice?.delta.content) {
        continue
      }
      yield choice
    }

    if (!areToolCallsCompleted(toolCalls)) {
      if (toolCalls) {
        console.warn('Tool calls were invoked but not completed')
      }
      return
    }

    if (isDev()) {
      console.info('\n\nTool calls:', JSON.stringify(toolCalls, null, 2), '\n')
    }

    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      const functionResponse = tryCallToolFunction(toolCall.function)
      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: functionResponse,
      })
    }

    const finalStream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    })

    for await (const chunk of finalStream) {
      if (stream.controller.signal.aborted) {
        finalStream.controller.abort(stream.controller.signal.reason)
      }

      if (finalStream.controller.signal.aborted) {
        break
      }

      const choice = chunk.choices.at(0)
      if (!choice?.delta.content) {
        continue
      }
      yield choice
    }
  }, stream.controller)
}

// Could be used in the future to be more flexible
// function encodeImage(filePath: string) {
//   filePath = filePath.replace(/^file:\/\//i, '')
//   const extension = filePath.split('.').pop()?.toLowerCase()
//   if (!extension) {
//     throw new Error('Invalid image file path')
//   }
//   return `data:image/${extension};base64,${fs.readFileSync(filePath).toString('base64')}`
// }
