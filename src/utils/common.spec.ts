import { once } from './common'

describe('once', () => {
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
