import fs from 'fs'
import path from 'path'

import {
  formatBytes,
  once,
  validateTool,
  type Tool,
  type ToolSchema,
} from '@aktyn-assistant/common'
import AssistantTool from '@aktyn-assistant-tools/assistant'
import WebSearchTool from '@aktyn-assistant-tools/web-search'
import { v4 as uuidv4 } from 'uuid'

import { getDataDirectory, logger } from '../utils'
import { calculateDirectorySize } from '../utils/file-helpers'

import { AI } from '.'

const defaultToolBase: Omit<ToolInfoBase, 'schema'> = {
  enabled: true,
  omitInRegularChat: false,
  omitInQuickChat: false,
  omitInQuickCommand: false,
  omitInVoiceCommand: false,
} as const

type ToolInfoBase = {
  schema: ToolSchema
  enabled: boolean
  omitInRegularChat: boolean
  omitInQuickChat: boolean
  omitInQuickCommand: boolean
  omitInVoiceCommand: boolean
}
export type BuiltInToolInfo = ToolInfoBase & {
  builtIn: true
}
export type ImportedToolInfo = ToolInfoBase & {
  directoryName: string
  mainFileRelativePath: string
  builtIn: false
}
export type ToolInfo = BuiltInToolInfo | ImportedToolInfo

const builtInTools = [...AssistantTool(), ...WebSearchTool()] as Array<
  Tool<object>
>

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

export function getActiveTools() {
  const toolInfos = loadToolsInfo()

  const moduleToolsBuffer = new Map<string, Array<Tool>>()

  const tools: Array<Tool & ToolInfo> = builtInTools.map((tool) => {
    const toolInfo = toolInfos.find(
      (toolInfo) => toolInfo.schema.functionName === tool.schema.functionName,
    )
    if (!toolInfo) {
      const builtInInfo = {
        schema: tool.schema,
        builtIn: true,
        ...defaultToolBase,
      } satisfies BuiltInToolInfo
      return { ...builtInInfo, ...tool }
    }
    return {
      ...toolInfo,
      ...tool,
    }
  })
  for (const toolInfo of toolInfos) {
    if (!toolInfo.enabled || toolInfo.builtIn) {
      continue
    }

    const mainFilePath = path.join(
      getToolsDirectoryPath(),
      toolInfo.directoryName,
      toolInfo.mainFileRelativePath,
    )
    try {
      const moduleTools =
        moduleToolsBuffer.get(toolInfo.directoryName) ??
        loadToolsFromExternalSource(mainFilePath)
      moduleToolsBuffer.set(toolInfo.directoryName, moduleTools)

      const extractedTool = moduleTools.find(
        (tool) => tool.schema.functionName === toolInfo.schema.functionName,
      )
      if (extractedTool) {
        tools.push({ ...toolInfo, ...extractedTool })
      }
    } catch (error) {
      logger.error(
        `Error while loading tool "${mainFilePath}"\n${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return tools
}

export function loadToolsInfo() {
  try {
    const indexPath = path.join(getToolsDirectoryPath(), 'index.json')
    if (!fs.existsSync(indexPath)) {
      const builtInToolInfos = builtInTools.map(
        (tool) =>
          ({
            schema: tool.schema,
            builtIn: true,
            ...defaultToolBase,
          }) satisfies BuiltInToolInfo,
      )
      saveToolsInfo(builtInToolInfos)
      return builtInToolInfos
    }

    let updated = false
    let toolInfos: ToolInfo[] = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    for (const builtInTool of builtInTools) {
      const foundBuiltInTool = toolInfos.find(
        (tool) => tool.schema.functionName === builtInTool.schema.functionName,
      )

      if (!foundBuiltInTool) {
        toolInfos.push({
          schema: builtInTool.schema,
          builtIn: true,
          ...defaultToolBase,
        })
      } else if (
        foundBuiltInTool.schema.version !== builtInTool.schema.version
      ) {
        logger.info(
          `Updating tools info file due to version change (tool: ${foundBuiltInTool.schema.functionName})`,
        )
        updated = true
        toolInfos = toolInfos.map((tool) =>
          tool.schema.functionName === foundBuiltInTool.schema.functionName
            ? {
                ...tool,
                schema: builtInTool.schema,
              }
            : tool,
        )
      }
    }
    if (updated) {
      saveToolsInfo(toolInfos)
    }
    return toolInfos
  } catch {
    return []
  }
}

function saveToolsInfo(data: Array<ToolInfo>) {
  if (!fs.existsSync(getToolsDirectoryPath())) {
    fs.mkdirSync(getToolsDirectoryPath(), { recursive: true })
  }
  fs.writeFileSync(
    path.join(getToolsDirectoryPath(), 'index.json'),
    JSON.stringify(data, null, 2),
    {
      encoding: 'utf8',
    },
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

  const toolInfos = loadToolsInfo()
  for (const tool of tools) {
    if (
      toolInfos.some((t) => t.schema.functionName === tool.schema.functionName)
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

    const importedTool: ImportedToolInfo = {
      schema: tool.schema,
      directoryName: toolsSourceId,
      mainFileRelativePath: path.relative(
        toolData.sourceDirectory,
        toolData.mainFile,
      ),
      builtIn: false,
      ...defaultToolBase,
    }
    toolInfos.push(importedTool)
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
  saveToolsInfo(toolInfos)

  AI.client()
    .then((client) => client.loadTools())
    .catch(logger.error)
}

export function setEnabledTools(toolNames: string[]) {
  const toolInfos = loadToolsInfo()
  for (const tool of toolInfos) {
    tool.enabled = toolNames.includes(tool.schema.functionName)
  }
  saveToolsInfo(toolInfos)

  AI.client()
    .then((client) => client.loadTools())
    .catch(logger.error)
}

export function editTool(updatedTool: ToolInfo) {
  const toolInfos = loadToolsInfo().map((toolInfo) =>
    toolInfo.schema.functionName === updatedTool.schema.functionName
      ? updatedTool
      : toolInfo,
  )
  saveToolsInfo(toolInfos)

  AI.client()
    .then((client) => client.loadTools())
    .catch(logger.error)
}

export function removeTool(toolName: string) {
  const toolInfos = loadToolsInfo()
  const tool = toolInfos.find(
    (tool) => !tool.builtIn && tool.schema.functionName === toolName,
  ) as ImportedToolInfo | undefined
  if (!tool) {
    throw new Error(`Imported tool with name "${toolName}" not found`)
  }
  toolInfos.splice(toolInfos.indexOf(tool), 1)
  saveToolsInfo(toolInfos)

  const importedToolInfos = toolInfos.filter((tool) => !tool.builtIn)
  if (
    !importedToolInfos.some((tool) => tool.directoryName === tool.directoryName)
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
          logger.error(error)
        }
      },
    )
  }

  AI.client()
    .then((client) => client.loadTools())
    .catch(logger.error)
}

export type ChatSource =
  | 'regular'
  | 'quick-chat'
  | 'quick-command'
  | 'voice-command'

const chatSourceMapping: {
  [key in ChatSource]: keyof Omit<ToolInfoBase, 'schema' | 'enabled'>
} = {
  regular: 'omitInRegularChat',
  'quick-chat': 'omitInQuickChat',
  'quick-command': 'omitInQuickCommand',
  'voice-command': 'omitInVoiceCommand',
}

export function omitTools(tools: (Tool & ToolInfo)[], source: ChatSource) {
  const omitPropertyName = chatSourceMapping[source]
  return tools.filter((tool) => !tool[omitPropertyName])
}
