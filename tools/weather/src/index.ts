type ToolSchema = {
  version?: string
  functionName: string
  description?: string
  parameters?: Record<string, unknown>
}

const toolSchema: ToolSchema = {
  version: '1.0.0',
  functionName: 'get_current_weather',
  description: 'Get the current weather in a given location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g. San Francisco, CA',
      },
      unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['location'], //required arguments in getCurrentWeather
  },
}

async function getCurrentWeather(data: { location: string; unit?: string }) {
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

export default function index() {
  return [
    {
      schema: toolSchema,
      function: getCurrentWeather,
    },
  ]
}
