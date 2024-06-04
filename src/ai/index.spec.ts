import { getAiClient, notifyAiError } from '.'
import { MOCKED_CHAT_RESPONSES } from './mock'

import '../test-utils/extend'

jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}))

describe('AI class', () => {
  const ai = getAiClient()

  beforeEach(() => {
    ai.setMockPaidRequests(true)
  })

  it(
    'should perform chat query',
    async () => {
      const now = Date.now()
      const chatStream = await ai.performChatQuery('Example query')
      let i = 3
      for await (const chunk of chatStream) {
        //@ts-expect-error method is extended and therefore not typed
        expect(chunk.content).toBeIn(MOCKED_CHAT_RESPONSES)
        expect(chunk.timestamp).toBeGreaterThanOrEqual(now)

        if (--i === 0) {
          chatStream.controller.abort('Reason message')
        }
      }
    },
    3 * 2000,
  )
})

describe('notifyAiError', () => {
  const errorLog = console.error

  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = errorLog
  })

  it('should notify error', () => {
    const error = new Error('Test error')
    notifyAiError(error)
    expect(console.error).toHaveBeenCalledWith(error)
  })
})
