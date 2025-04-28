import { vi, describe, it, expect } from 'vitest'

import { printError } from './error'

describe(printError.name, () => {
  it('should print error', () => {
    const stdoutWrite = process.stdout.write
    const stderrWrite = process.stderr.write
    process.stdout.write = vi.fn() as any // Type assertion needed for mock
    process.stderr.write = vi.fn() as any // Type assertion needed for mock

    printError({
      title: 'Test error',
      message: 'Test message',
    })
    expect(process.stderr.write).toHaveBeenCalledWith('\nTest error\n')
    expect(process.stderr.write).toHaveBeenCalledWith('Test message\n')

    process.stdout.write = stdoutWrite
    process.stderr.write = stderrWrite
  })
})
