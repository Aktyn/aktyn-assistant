import { vi, describe, it, expect, afterEach } from 'vitest'

const processExit = vi.fn()
const keyEvents: any[] = []
const on = vi.fn().mockImplementation((event: string, callback: Function) => {
  if (event === 'key') {
    keyEvents.push({ event, callback })
  }
})
const off = vi.fn().mockImplementation((event: string, callback: Function) => {
  if (event === 'key') {
    keyEvents.splice(keyEvents.indexOf({ event, callback }), 1)
  }
})

vi.mock('terminal-kit', () => ({
  terminal: {
    processExit,
    on,
    off,
    width: 64,
    defaultColor: vi.fn(),
  },
}))

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
    expect(terminal.defaultColor).toHaveBeenCalledWith(
      '     Test text (first line)\n',
    )
    expect(terminal.defaultColor).toHaveBeenCalledWith('     Another line\n')
  })

  it('should not print centered text if terminal width is too small', () => {
    const text = 'Test text (first line)\nAnother line'
    terminal.width = 16
    printCentered(text)
    expect(terminal.defaultColor).not.toHaveBeenCalled()
  })
})
