import type { ChildProcess } from 'child_process'

import { once, type Tool, type ToolSchema } from '@aktyn-assistant/common'

import { getUrl } from '../common/web-helpers'

const getOpenMethods = once(() =>
  import('open').then(({ default: open, openApp }) => ({
    open,
    openApp,
  })),
)

const toolSchema: ToolSchema = {
  version: '1.0.5',
  functionName: 'open_site',
  description:
    "Open a website. If you don't know the exact URL, create a web engine search query that will be used to find and open the site.",
  parameters: {
    type: 'object',
    properties: {
      url_or_query: {
        type: 'string',
        description: 'URL to open or web engine search query',
      },
    },
    required: ['url_or_query'],
  },
  // strict: true, //? would be nice to test it
}

type OpenSiteParameters = { url_or_query: string }

async function openSite({ url_or_query }: OpenSiteParameters) {
  try {
    const url = await getUrl(url_or_query)

    const { open } = await getOpenMethods()
    const child = await open(url)
    return await resolveChildProcess(child, url)
  } catch (error) {
    return error instanceof Error
      ? error.message
      : `Failed to open "${url_or_query}"`
  }
}

function resolveChildProcess(child: ChildProcess, url: string) {
  child.unref()
  return new Promise<string>((resolve, reject) => {
    let resolved = false
    const timeout = setTimeout(() => {
      reject(`Opening "${url}" timed out`)
      resolved = true
    }, 10_000)

    child.on('spawn', () => {
      if (!resolved) {
        clearTimeout(timeout)
        resolve(`"${url}" has been opened`)
      }
    })
    child.on('error', (error) => {
      if (!resolved) {
        clearTimeout(timeout)
        reject(error.message)
      }
    })
  })
}

export const openSiteTool = {
  schema: toolSchema,
  function: openSite,
} satisfies Tool<OpenSiteParameters>
