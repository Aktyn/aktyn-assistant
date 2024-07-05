import type { Tool, ToolSchema } from '@aktyn-assistant/common'

import { scrapeSearchResults } from './scraper'

const toolSchema: ToolSchema = {
  version: '1.0.0', //TODO: add versioning
  functionName: 'search_web',
  //TODO: make it user editable (with option to restore original description)
  description:
    'Run a search on the web to find information required to answer the question or to retrieve recent information about the topic',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The query to search for', //TODO: also make it user editable
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

export default function index(): Tool[] {
  return [
    {
      schema: toolSchema,
      function: searchWeb as Tool['function'],
    },
  ]
}
