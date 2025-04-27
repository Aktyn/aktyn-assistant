import type { Tool, ToolSchema } from '@aktyn-assistant/common'

import { scrapeSearchResults } from './scraper'

const toolSchema: ToolSchema = {
  version: '1.2.0',
  functionName: 'search_web',
  //TODO: make it user editable (with option to restore original description)
  description:
    'Use this function to search the web for missing information necessary to answer the question. It will return a few most relevant results from the web search engine.',
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

  //TODO: fetch and scrape from full duckduckgo search results (appearing summaries can be extra useful
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  )
  const html = await res.text()
  const scrapedData = scrapeSearchResults(html)

  return scrapedData
    .map((entry) => {
      return [
        entry.title && `Title: ${entry.title}`,
        entry.url && `Url: ${entry.url.href}`,
        entry.content && `Content: ${entry.content}`,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

export default function index() {
  return [
    {
      schema: toolSchema,
      function: searchWeb,
    } satisfies Tool<{ query: string }>,
  ]
}
