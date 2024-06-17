const notifyMock = jest.fn()

jest.mock('node-notifier', () => ({
  notify: notifyMock,
}))
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: (filePath: string) => {
    if (filePath.endsWith('config.json')) {
      return JSON.stringify({
        selectedAiProvider: 'openai',
        selectedChatModel: 'gpt-3.5-turbo',
        mockPaidRequests: true,
      })
    }
    return 'mock file content'
  },
}))
jest.mock('openai', () => ({
  __esModule: true,
  OpenAI: class OpenAiMock {
    constructor(_: any) {}
    models = {
      list: jest.fn(),
    }
  },
}))

import { AI, AiProviderType } from '.'
import { LOREM_IPSUM_WORDS, RESPONSE_WITH_CODE_WORDS } from './mock'

import '../test-utils/extend'

describe('AI class', () => {
  it(
    'should perform chat query',
    async () => {
      const ai = await AI.client({
        providerType: AiProviderType.openai,
        requestApiKey: async () => 'mock api key',
      })

      const now = Date.now()
      const chatStream = await ai.performChatQuery(
        'Example query',
        'gpt-3.5-turbo',
      )
      let i = 30
      for await (const response of chatStream) {
        //@ts-expect-error method is extended and therefore not typed
        expect(response.content).toBeIn([
          ...LOREM_IPSUM_WORDS,
          ...RESPONSE_WITH_CODE_WORDS,
        ])
        expect(response.timestamp).toBeGreaterThanOrEqual(now)

        if (--i === 0) {
          chatStream.controller.abort('Reason message')
        }
      }
    },
    30 * 200,
  )
})

describe(AI.notifyError.name, () => {
  const errorLog = console.error

  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = errorLog
  })

  it('should notify error', () => {
    const error = new Error('Test error')
    process.env.NODE_ENV = 'dev'
    AI.notifyError(error)
    expect(notifyMock).toHaveBeenCalledWith({
      title: 'AI error',
      message: 'Test error',
    })
  })
})
