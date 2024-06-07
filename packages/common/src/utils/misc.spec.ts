import { once, wait } from './misc'

describe(once.name, () => {
  it('should return value', () => {
    const fn = jest.fn(() => 'test')
    const onceFn = once(fn)
    expect(onceFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should return cached value', () => {
    const fn = jest.fn(() => 'test')
    const onceFn = once(fn)
    expect(onceFn()).toBe('test')
    expect(onceFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should work with promise', async () => {
    const fn = jest.fn(() => Promise.resolve('test'))
    const onceFn = once(fn)
    expect(await onceFn()).toBe('test')
    expect(await onceFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe(wait.name, () => {
  it('should wait for given time', async () => {
    const startTime = Date.now()
    await wait(100)
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(100)
  })
})
