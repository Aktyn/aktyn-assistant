import { isDev } from '@aktyn-assistant/common'
import type { OpenAI } from 'openai'

type Choice = OpenAI.ChatCompletionChunk.Choice

/**
 * @see https://platform.openai.com/docs/guides/function-calling/supported-models
 * */
export const OPEN_AI_TOOLS: Array<OpenAI.Chat.Completions.ChatCompletionTool> =
  [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              //TODO: dynamically set location in the string below
              description: 'The city and state, e.g. San Francisco, CA',
            },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
          },
          required: ['location'], //required arguments in getCurrentWeather
        },
      },
    },
  ]

export function tryCallToolFunction(
  functionData: OpenAI.Chat.Completions.ChatCompletionMessageToolCall['function'],
) {
  try {
    const functionToCall =
      toolFunctions[functionData.name as keyof typeof toolFunctions]
    return functionToCall(JSON.parse(functionData.arguments))
  } catch (error) {
    if (isDev()) {
      console.error('Error while calling tool function', error)
    }
    return ''
  }
}

export function appendToToolCalls(
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

export function areToolCallsCompleted(
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

type ToolFunction<T extends object> = (data: T) => string

const getCurrentWeather: ToolFunction<{ location: string; unit?: string }> = (
  data,
) => {
  const { location } = data

  if (location.toLowerCase().includes('tokyo')) {
    return JSON.stringify({
      location: 'Tokyo',
      temperature: '10',
      unit: 'celsius',
    })
  } else if (location.toLowerCase().includes('san francisco')) {
    return JSON.stringify({
      location: 'San Francisco',
      temperature: '72',
      unit: 'fahrenheit',
    })
  } else if (location.toLowerCase().includes('paris')) {
    return JSON.stringify({
      location: 'Paris',
      temperature: '22',
      unit: 'fahrenheit',
    })
  } else {
    return JSON.stringify({ location, temperature: 'unknown' })
  }
}

const toolFunctions = {
  get_current_weather: getCurrentWeather,
} satisfies {
  [functionName: string]: ToolFunction<never>
}
