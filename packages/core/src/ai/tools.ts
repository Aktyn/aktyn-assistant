import fs from 'fs'

import { formatBytes, validateTool, type Tool } from '@aktyn-assistant/common'

import { calculateDirectorySize } from '../utils/file-helpers'

function loadToolsFromExternalSource(indexPath: string) {
  const tools: Tool[] = []

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: index } = require(indexPath)
  if (typeof index !== 'function') {
    throw new Error(
      'Tool index file must default export a function that returns array of tools',
      index,
    )
  }
  for (const tool of index()) {
    const validationError = validateTool(tool)

    if (!validationError) {
      tools.push(tool)
    } else {
      throw new Error(validationError)
    }
  }

  return tools
}

//TODO: test by mocking file system
export async function loadTools(): Promise<Array<Tool>> {
  //TODO get from user config and pass to this function as an argument
  const fileList: string[] = [
    // '/home/aktyn/Programming/aktyn-assistant/tools/weather/dist/index.js',
  ]

  const tools: Array<Tool> = []

  for (const indexPath of fileList) {
    try {
      const moduleTools = loadToolsFromExternalSource(indexPath)
      if (moduleTools.length) {
        tools.push(...moduleTools)
      }
    } catch (error) {
      console.error(
        `Error while loading tool "${indexPath}"\n${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return tools
}

export type ToolData = {
  toolName: string
  sourceDirectory: string
  mainFile: string
}

export async function addTool(toolData: ToolData) {
  if (!fs.existsSync(toolData.sourceDirectory)) {
    throw new Error(
      `Source directory does not exist: ${toolData.sourceDirectory}`,
    )
  }
  if (!fs.existsSync(toolData.mainFile)) {
    throw new Error(`Main file does not exist: ${toolData.mainFile}`)
  }

  const directorySize = calculateDirectorySize(toolData.sourceDirectory)
  const directorySizeLimit = 1024 * 1024 * 5
  if (directorySize > directorySizeLimit) {
    throw new Error(
      `Tool source directory is too big: ${formatBytes(directorySize)}; limit is ${formatBytes(
        directorySizeLimit,
      )}`,
    )
  }

  const tools = loadToolsFromExternalSource(toolData.mainFile)
  if (!tools.length) {
    throw new Error(`No tools found in ${toolData.mainFile}`)
  }

  //TODO: copy sources and save entry to external config
  //...
}
