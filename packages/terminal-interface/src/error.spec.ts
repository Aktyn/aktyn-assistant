import { printError } from './error'

describe('printError', () => {
  it('should print error', () => {
    const stdoutWrite = process.stdout.write
    const stderrWrite = process.stderr.write
    process.stdout.write = jest.fn()
    process.stderr.write = jest.fn()

    printError({
      title: 'Test error',
      message: 'Test message',
    })
    expect(process.stdout.write).not.toHaveBeenCalled
    expect(process.stderr.write).toHaveBeenCalledWith('\nTest error\n')
    expect(process.stderr.write).toHaveBeenCalledWith('Test message\n')

    process.stdout.write = stdoutWrite
    process.stderr.write = stderrWrite
  })
})
