import { isDev, type ChatMessage, type Tool } from '@aktyn-assistant/common'
import type { OpenAI } from 'openai'
import { Stream } from 'openai/streaming'

type Choice = OpenAI.Chat.Completions.ChatCompletionChunk.Choice
type OpenAiMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

const conversationsHistory: Map<
  string,
  { messages: OpenAiMessage[]; updateTimestamp: number }
> = new Map()

function updateConversationHistory(
  conversationId: string,
  messages: OpenAiMessage[],
) {
  conversationsHistory.set(conversationId, {
    messages,
    updateTimestamp: Date.now(),
  })
}

function deleteOldConversations() {
  const now = Date.now()
  const lifetime = 1000 * 60 * 60 * 40 // 4 hours
  for (const [conversationId, conversation] of conversationsHistory) {
    if (now - conversation.updateTimestamp > lifetime) {
      conversationsHistory.delete(conversationId)
    }
  }
}

function mapUserMessagesContent(
  contents: ChatMessage['contents'],
): OpenAI.Chat.Completions.ChatCompletionUserMessageParam {
  return {
    role: 'user',
    content: contents.map<OpenAI.Chat.Completions.ChatCompletionContentPart>(
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
  }
}

//istanbul ignore next
export async function performChatQuery(
  client: OpenAI,
  message: ChatMessage,
  model: string,
  tools: Array<Tool>,
  numberOfPreviousMessagesToInclude = 0,
) {
  const previousMessages =
    numberOfPreviousMessagesToInclude > 0
      ? (
          conversationsHistory.get(message.conversationId)?.messages ?? []
        ).slice(-numberOfPreviousMessagesToInclude)
      : []
  const openAiMessage: OpenAiMessage =
    message.contents.length === 1 && message.contents[0].type === 'text'
      ? { role: 'user', content: message.contents[0].content }
      : mapUserMessagesContent(message.contents)

  deleteOldConversations()

  const messages = [...previousMessages, openAiMessage]
  updateConversationHistory(message.conversationId, messages)

  if (isDev()) {
    console.info(
      `Sending chat messages to OpenAI API: ${JSON.stringify(messages)}; conversationId: ${message.conversationId}`,
    )
  }
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    tools: tools.length
      ? tools.map(({ schema }) => ({
          type: 'function',
          function: {
            name: schema.functionName,
            description: schema.description,
            parameters: schema.parameters,
          },
        }))
      : undefined,
    tool_choice: tools.length ? 'auto' : undefined,
    // stream_options: {include_usage: true} // Use this to get usage info
  })

  return new Stream<Choice>(async function* transformStream() {
    let toolCalls: Required<Choice['delta']>['tool_calls'] | null = null

    let streamContentBuffer = ''
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
      streamContentBuffer += choice.delta.content
      yield choice
    }

    if (!toolCalls) {
      messages.push({
        role: 'assistant',
        content: streamContentBuffer,
      })
      updateConversationHistory(message.conversationId, messages)

      return
    } else if (!areToolCallsCompleted(toolCalls)) {
      console.warn('Tool calls were invoked but not completed')
      return
    }

    if (isDev()) {
      console.info('Tool calls:', JSON.stringify(toolCalls, null, 2))
    }

    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      const functionResponse = await tryCallToolFunction(
        tools,
        toolCall.function,
      )
      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: functionResponse,
      })
    }

    updateConversationHistory(message.conversationId, messages)

    if (isDev()) {
      console.info(
        `Sending chat messages to OpenAI API after tool calls: ${JSON.stringify(
          messages,
        )}; conversationId: ${message.conversationId}`,
      )
    }
    const finalStream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    })

    let finalStreamContentBuffer = ''
    for await (const chunk of finalStream) {
      if (stream.controller.signal.aborted) {
        finalStream.controller.abort(stream.controller.signal.reason)
        break
      }

      if (finalStream.controller.signal.aborted) {
        break
      }

      const choice = chunk.choices.at(0)
      if (!choice?.delta.content) {
        continue
      }
      finalStreamContentBuffer += choice.delta.content
      yield choice
    }

    messages.push({
      role: 'assistant',
      content: finalStreamContentBuffer,
    })
    updateConversationHistory(message.conversationId, messages)
  }, stream.controller)
}

function tryCallToolFunction(
  tools: Array<Tool>,
  functionData: OpenAI.Chat.Completions.ChatCompletionMessageToolCall['function'],
) {
  try {
    const tool = tools.find(
      (tool) => tool.schema.functionName === functionData.name,
    )
    if (!tool) {
      throw new Error(`Tool not found: ${functionData.name}`)
    }
    return tool.function(JSON.parse(functionData.arguments))
  } catch (error) {
    if (isDev()) {
      console.error(
        `Error while calling tool function "${functionData.name}"`,
        error,
      )
    }
    return ''
  }
}

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

// Could be used in the future to be more flexible
// function encodeImage(filePath: string) {
//   filePath = filePath.replace(/^file:\/\//i, '')
//   const extension = filePath.split('.').pop()?.toLowerCase()
//   if (!extension) {
//     throw new Error('Invalid image file path')
//   }
//   return `data:image/${extension};base64,${fs.readFileSync(filePath).toString('base64')}`
// }
