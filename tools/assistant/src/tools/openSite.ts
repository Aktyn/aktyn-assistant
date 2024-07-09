import type { ChildProcess } from 'child_process'

import { once, type Tool, type ToolSchema } from '@aktyn-assistant/common'

const getOpenMethods = once(() =>
  import('open').then(({ default: open, openApp }) => ({
    open,
    openApp,
  })),
)

const toolSchema: ToolSchema = {
  version: '1.0.0',
  functionName: 'open_site',
  description: 'Open a website',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to open',
      },
    },
    required: ['url'],
  },
}

async function openSite(data: { url: string }) {
  const { url } = data

  try {
    if (
      !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url)
    ) {
      return `Invalid URL: ${url}`
    }
    const { open } = await getOpenMethods()
    const child = await open(url)
    return resolveChildProcess(child, url)

    // const { openApp } = await getOpenMethods()
    // const child = await openApp(nameOrUrl)
    // return resolveChildProcess(child, nameOrUrl)
  } catch (error) {
    return error instanceof Error ? error.message : `Failed to open "${url}"`
  }
}

function resolveChildProcess(child: ChildProcess, url: string) {
  child.unref()
  return new Promise<string>((resolve) => {
    let resolved = false
    const timeout = setTimeout(() => {
      resolve(`Opening "${url}" timed out`)
      resolved = true
    }, 10_000)

    child.on('spawn', () => {
      if (!resolved) {
        clearTimeout(timeout)
        resolve(`"${url}" is now running`)
      }
    })
    child.on('error', (error) => {
      if (!resolved) {
        clearTimeout(timeout)
        resolve(error.message)
      }
    })
  })
}

export const openSiteTool = {
  schema: toolSchema,
  function: openSite,
} satisfies Tool<{ url: string }>
