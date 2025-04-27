import { vi, describe, it, expect } from 'vitest'
import type { ToolSchema } from '@aktyn-assistant/common'

import { getActiveTools, loadToolsInfo } from './tools'

const mockSchema: ToolSchema = {
  version: '1.0.0',
  functionName: 'mock_function',
  description: 'foo',
  parameters: {},
}

vi.mock('../utils', () => ({
  getDataDirectory: () => '/mock',
}))

vi.mock('fs', () => ({
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
}))

vi.mock('/mock/tools/foo/bar.js', () => ({
  __esModule: true,
  default: () => [
    {
      schema: mockSchema,
      function: vi.fn(),
    },
  ],
}))

describe(getActiveTools.name, () => {
  it('should return list of available tools', () => {
    const tools = getActiveTools()
    expect(tools.length).toBe(3) // + built-in tools
    expect(tools.at(-1)!.schema.version).toBe('1.0.0')
    expect(tools.at(-1)!.schema.functionName).toBe('mock_function')
    expect(tools.at(-1)!.schema.description).toBe('foo')
    expect(tools.at(-1)!.schema.parameters).toStrictEqual({})
  })
})

describe(loadToolsInfo.name, () => {
  it('should load available tools', () => {
    const tools = loadToolsInfo().filter((tool) => !tool.builtIn)
    expect(tools.length).toBe(1)
    expect(tools[0].schema).toEqual(mockSchema)
    expect(tools[0].enabled).toBe(true)
    expect(tools[0].directoryName).toBe('foo')
    expect(tools[0].mainFileRelativePath).toBe('bar.js')
  })
})
