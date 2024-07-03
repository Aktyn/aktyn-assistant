import { scrapeSearchResults } from './scraper'

type ToolSchema = {
  functionName: string
  description?: string
  parameters?: Record<string, unknown>
}

const toolSchema: ToolSchema = {
  functionName: 'search_web',
  description:
    'Run a search on the web to find information required to answer the question or to retrieve recent information about the topic',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The query to search for',
      },
    },
    required: ['query'],
  },
}

async function searchWeb(data: { query: string }) {
  const { query } = data

  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  )
  const html = await res.text()
  const scrapedData = scrapeSearchResults(html)

  return JSON.stringify(scrapedData)
}

export default function index() {
  return [
    {
      schema: toolSchema,
      function: searchWeb,
    },
  ]
}
