import fs from 'fs'
import path from 'path'

import {
  formatBytes,
  once,
  validateTool,
  type Tool,
} from '@aktyn-assistant/common'
import { v4 as uuidv4 } from 'uuid'

import { getDataDirectory } from '../utils'
import { calculateDirectorySize } from '../utils/file-helpers'

import { AI } from '.'

export type AvailableToolsInfo = {
  functionName: string
  description?: string
  enabled: boolean
  directoryName: string
  mainFileRelativePath: string
}

const getToolsDirectoryPath = once(() => path.join(getDataDirectory(), 'tools'))

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
export function getActiveTools(): Array<Tool> {
  const availableTools = loadAvailableToolsInfo()

  const moduleToolsBuffer = new Map<string, Array<Tool>>()

  const tools: Array<Tool> = []
  for (const availableTool of availableTools) {
    if (!availableTool.enabled) {
      continue
    }

    const mainFilePath = path.join(
      getToolsDirectoryPath(),
      availableTool.directoryName,
      availableTool.mainFileRelativePath,
    )
    try {
      const moduleTools =
        moduleToolsBuffer.get(availableTool.directoryName) ??
        loadToolsFromExternalSource(mainFilePath)
      moduleToolsBuffer.set(availableTool.directoryName, moduleTools)

      const extractedTool = moduleTools.find(
        (tool) => tool.schema.functionName === availableTool.functionName,
      )
      if (extractedTool) {
        tools.push(extractedTool)
      }
    } catch (error) {
      console.error(
        `Error while loading tool "${mainFilePath}"\n${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return tools
}

export function loadAvailableToolsInfo(): Array<AvailableToolsInfo> {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(getToolsDirectoryPath(), 'index.json'), 'utf8'),
    )
    return data
  } catch {
    return []
  }
}
function saveAvailableToolsInfo(data: Array<AvailableToolsInfo>) {
  fs.writeFileSync(
    path.join(getToolsDirectoryPath(), 'index.json'),
    JSON.stringify(data, null, 2),
    'utf8',
  )
}

export type ToolsSourceData = {
  sourceDirectory: string
  mainFile: string
}
export function addToolsSource(toolData: ToolsSourceData) {
  if (!fs.existsSync(toolData.sourceDirectory)) {
    throw new Error(
      `Source directory does not exist: ${toolData.sourceDirectory}`,
    )
  }
  if (!fs.existsSync(toolData.mainFile)) {
    throw new Error(`Main file does not exist: ${toolData.mainFile}`)
  }

  const directorySize = calculateDirectorySize(toolData.sourceDirectory)
  const directorySizeLimit = 1024 * 1024 * 512
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

  const toolsSourceId = uuidv4()

  const availableTools = loadAvailableToolsInfo()
  for (const tool of tools) {
    if (
      availableTools.some((t) => t.functionName === tool.schema.functionName)
    ) {
      if (tools.length === 1) {
        throw new Error(
          `Tool with name "${tool.schema.functionName}" already exists`,
        )
      } else {
        AI.notifyError(
          new Error(
            `Tool with name "${tool.schema.functionName}" already exists`,
          ),
          'Tool already exists',
        )
        continue
      }
    }

    availableTools.push({
      functionName: tool.schema.functionName,
      description: tool.schema.description,
      enabled: true,
      directoryName: toolsSourceId,
      mainFileRelativePath: path.relative(
        toolData.sourceDirectory,
        toolData.mainFile,
      ),
    })
  }

  const toolsDirectory = getToolsDirectoryPath()
  if (!fs.existsSync(path.dirname(toolsDirectory))) {
    fs.mkdirSync(path.dirname(toolsDirectory), { recursive: true })
  }

  const toolsSourceTargetDirectory = path.join(toolsDirectory, toolsSourceId)
  fs.cpSync(toolData.sourceDirectory, toolsSourceTargetDirectory, {
    recursive: true,
    dereference: true,
    force: true,
  })
  saveAvailableToolsInfo(availableTools)

  AI.client()
    .then((client) => client.loadTools())
    .catch(console.error)
}

export function setEnabledTools(toolNames: string[]) {
  const availableTools = loadAvailableToolsInfo()
  for (const tool of availableTools) {
    tool.enabled = toolNames.includes(tool.functionName)
  }
  saveAvailableToolsInfo(availableTools)

  AI.client()
    .then((client) => client.loadTools())
    .catch(console.error)
}

export function removeTool(toolName: string) {
  const availableTools = loadAvailableToolsInfo()
  const tool = availableTools.find((tool) => tool.functionName === toolName)
  if (!tool) {
    throw new Error(`Tool with name "${toolName}" not found`)
  }
  availableTools.splice(availableTools.indexOf(tool), 1)
  saveAvailableToolsInfo(availableTools)

  if (
    !availableTools.some((tool) => tool.directoryName === tool.directoryName)
  ) {
    fs.rm(
      path.join(getToolsDirectoryPath(), tool.directoryName),
      {
        force: true,
        recursive: true,
        maxRetries: 32,
      },
      (error) => {
        if (error) {
          console.error(error)
        }
      },
    )
  }

  AI.client()
    .then((client) => client.loadTools())
    .catch(console.error)
}
