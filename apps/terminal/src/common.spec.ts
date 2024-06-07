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
    width: 64,
    defaultColor: jest.fn(),
  },
}))
// jest.mock('@aktyn-assistant/terminal-interface', () => ({
//   printError: jest.fn(),
//   requestApiKey: () => Promise.resolve('mock api key'),
// }))

import { terminal } from 'terminal-kit'

import { printCentered, toggleTerminateOnCtrlC } from './common'

describe(toggleTerminateOnCtrlC.name, () => {
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

describe(printCentered.name, () => {
  it('should print centered text', () => {
    const text = 'Test text (first line)\nAnother line'
    terminal.width = 32
    printCentered(text)
    expect(terminal.defaultColor).toHaveBeenCalledWith('     Test text (first line)\n')
    expect(terminal.defaultColor).toHaveBeenCalledWith('     Another line\n')
  })

  it('should not print centered text if terminal width is too small', () => {
    const text = 'Test text (first line)\nAnother line'
    terminal.width = 16
    printCentered(text)
    expect(terminal.defaultColor).not.toHaveBeenCalled()
  })
})
