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
  functionName: 'open_site_or_run_application',
  description: 'Open a website or run an application',
  parameters: {
    type: 'object',
    properties: {
      nameOrUrl: {
        type: 'string',
        description: 'Name of the application or URL to open',
      },
    },
    required: ['nameOrUrl'],
  },
}

async function openSiteOrRunApplication(data: { nameOrUrl: string }) {
  const { nameOrUrl } = data

  try {
    if (
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(
        nameOrUrl,
      )
    ) {
      const { open } = await getOpenMethods()
      const child = await open(nameOrUrl)
      return resolveChildProcess(child, nameOrUrl)
    }

    const { openApp } = await getOpenMethods()
    const child = await openApp(nameOrUrl)
    return resolveChildProcess(child, nameOrUrl)
  } catch (error) {
    return error instanceof Error
      ? error.message
      : `Failed to open "${nameOrUrl}"`
  }
}

function resolveChildProcess(child: ChildProcess, nameOrUrl: string) {
  child.unref()
  return new Promise<string>((resolve) => {
    let resolved = false
    const timeout = setTimeout(() => {
      resolve(`Opening "${nameOrUrl}" timed out`)
      resolved = true
    }, 10_000)

    child.on('spawn', () => {
      if (!resolved) {
        clearTimeout(timeout)
        resolve(`"${nameOrUrl}" is now running`)
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

export const openSiteOrRunApplicationTool = {
  schema: toolSchema,
  function: openSiteOrRunApplication,
} satisfies Tool<{ nameOrUrl: string }>
