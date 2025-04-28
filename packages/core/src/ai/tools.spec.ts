/* eslint-disable import/order */
import { vi, describe, it, expect } from 'vitest'

const mockSchema: ToolSchema = {
  version: '1.2.0',
  functionName: 'mock_function',
  description: 'foo',
  parameters: {},
}

vi.mock('../utils', () => {
  const utilsModule = {
    getDataDirectory: () => '/mock',
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }

  return {
    ...utilsModule,
    default: utilsModule,
  }
})

vi.mock('fs', () => {
  const fsModule = {
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn((filePath: string) => filePath.endsWith('index.json')),
    unlinkSync: vi.fn(),
    readFileSync: (filePath: string) => {
      if (filePath.endsWith('index.json')) {
        return JSON.stringify([
          {
            schema: mockSchema,
            enabled: true,
            directoryName: 'foo',
            mainFileRelativePath: 'bar.js',
          },
        ])
      }
      return 'mock file content'
    },
  }

  return {
    ...fsModule,
    default: fsModule,
  }
})

import type { ToolSchema } from '@aktyn-assistant/common'

import { getActiveTools, loadToolsInfo } from './tools'

describe(getActiveTools.name, () => {
  it('should return list of available tools', () => {
    const tools = getActiveTools()

    expect(tools.length).toBe(3) // + built-in tools
    expect(tools.at(-1)!.schema.version).toBe('1.2.0')
    expect(tools.at(-1)!.schema.functionName).toBe('search_web')
    expect(tools.at(-1)!.schema.description).toBe(
      'Use this function to search the web for missing information necessary to answer the question. It will return a few most relevant results from the web search engine.',
    )
    // expect(tools.at(-1)!.schema.parameters).toStrictEqual({})
  })
})

describe(loadToolsInfo.name, () => {
  it('should load available tools', () => {
    const tools = loadToolsInfo().filter((tool) => !tool.builtIn)
    expect(tools.length).toBe(1)
    expect(tools.at(-1)!.schema).toEqual(mockSchema)
    expect(tools.at(-1)!.enabled).toBe(true)
    expect(tools.at(-1)!.directoryName).toBe('foo')
    expect(tools.at(-1)!.mainFileRelativePath).toBe('bar.js')
  })
})
