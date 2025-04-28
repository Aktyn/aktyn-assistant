import { terminal } from 'terminal-kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { printCentered, toggleTerminateOnKeys } from './common'

function terminateOnCtrlC(key: string) {
  if (key === 'CTRL_C') {
    terminal.processExit(0)
  }
}

interface KeyEvent {
  event: string
  callback: (...args: any[]) => void
}

vi.mock('terminal-kit', () => {
  const keyEvents: KeyEvent[] = []
  const processExit = vi.fn()

  const onImplementation = (
    event: string,
    callback: (...args: any[]) => void,
  ) => {
    if (event === 'key') {
      keyEvents.push({ event, callback })
    }
  }

  const offImplementation = (
    event: string,
    callback: (...args: any[]) => void,
  ) => {
    if (event === 'key') {
      const index = keyEvents.findIndex(
        (item) => item.event === event && item.callback === callback,
      )
      if (index > -1) {
        keyEvents.splice(index, 1)
      }
    }
  }

  return {
    terminal: {
      _keyEventsRef: keyEvents,
      processExit,
      on: vi.fn(onImplementation),
      off: vi.fn(offImplementation),
      width: 64,
      defaultColor: vi.fn(),
    },
  }
})

describe('Common Terminal Functions', () => {
  describe(toggleTerminateOnKeys.name, () => {
    beforeEach(() => {
      const keyEvents = (vi.mocked(terminal) as any)._keyEventsRef
      keyEvents.length = 0

      const mocks = vi.mocked(terminal, true)
      mocks.processExit.mockClear()
      mocks.on.mockClear()
      mocks.off.mockClear()
      mocks.defaultColor.mockClear()
    })

    it('should toggle terminate on ctrl c', () => {
      toggleTerminateOnKeys(true, terminateOnCtrlC)
      expect(terminal.on).toHaveBeenCalledWith('key', terminateOnCtrlC)

      const keyEvents = (vi.mocked(terminal) as any)._keyEventsRef
      const keyHandler = keyEvents.find(
        (item: KeyEvent) => item.event === 'key',
      )?.callback
      expect(keyHandler).toBe(terminateOnCtrlC)

      if (keyHandler) {
        keyHandler('CTRL_C')
      }

      expect(vi.mocked(terminal.processExit)).toHaveBeenCalledWith(0)
    })

    it('should not toggle terminate on ctrl c', () => {
      terminal.on('key', terminateOnCtrlC)

      toggleTerminateOnKeys(false, terminateOnCtrlC)
      expect(terminal.off).toHaveBeenCalledWith('key', terminateOnCtrlC)

      const keyEventsPostOff = (vi.mocked(terminal) as any)._keyEventsRef
      expect(
        keyEventsPostOff.find((item: KeyEvent) => item.event === 'key'),
      ).toBeUndefined()

      const keyEventsAgain = (vi.mocked(terminal) as any)._keyEventsRef
      const remainingHandler = keyEventsAgain.find(
        (item: KeyEvent) => item.event === 'key',
      )?.callback
      if (remainingHandler) {
        remainingHandler('CTRL_C')
      }

      expect(vi.mocked(terminal.processExit)).not.toHaveBeenCalled()
    })
  })

  describe(printCentered.name, () => {
    beforeEach(() => {
      const mocks = vi.mocked(terminal, true)
      mocks.defaultColor.mockClear()
    })

    it('should print centered text', () => {
      const text = 'Test text (first line)\nAnother line'
      vi.mocked(terminal).width = 32
      printCentered(text)
      expect(vi.mocked(terminal.defaultColor)).toHaveBeenCalledWith(
        '     Test text (first line)\n',
      )
      expect(vi.mocked(terminal.defaultColor)).toHaveBeenCalledWith(
        '     Another line\n',
      )
    })

    it('should not print centered text if terminal width is too small', () => {
      const text = 'Test text (first line)\nAnother line'
      vi.mocked(terminal).width = 16
      printCentered(text)
      expect(vi.mocked(terminal.defaultColor)).not.toHaveBeenCalled()
    })
  })
})
