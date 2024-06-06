const processExit = jest.fn()
const keyEvents: any[] = []
const on = jest.fn().mockImplementation((event, callback) => {
  if (event === 'key') {
    keyEvents.push({ event, callback })
  }
})
const off = jest.fn().mockImplementation((event, callback) => {
  if (event === 'key') {
    keyEvents.splice(keyEvents.indexOf({ event, callback }), 1)
  }
})

jest.mock('terminal-kit', () => ({
  terminal: {
    processExit,
    on,
    off,
  },
}))

import { toggleTerminateOnCtrlC } from './common'

describe('toggleTerminateOnCtrlC', () => {
  afterEach(() => {
    processExit.mockClear()
    on.mockClear()
    keyEvents.length = 0
  })

  it('should toggle terminate on ctrl c', () => {
    toggleTerminateOnCtrlC(true)
    keyEvents.forEach(({ callback }) => callback('CTRL_C'))
    expect(processExit).toHaveBeenCalled()
  })

  it('should not toggle terminate on ctrl c', () => {
    toggleTerminateOnCtrlC(false)
    keyEvents.forEach(({ callback }) => callback('CTRL_C'))
    expect(processExit).not.toHaveBeenCalled()
  })
})
