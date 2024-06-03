import { lazy } from './common'

describe('lazy', () => {
  it('should return value', () => {
    const fn = jest.fn(() => 'test')
    const lazyFn = lazy(fn)
    expect(lazyFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should return cached value', () => {
    const fn = jest.fn(() => 'test')
    const lazyFn = lazy(fn)
    expect(lazyFn()).toBe('test')
    expect(lazyFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should work with promise', async () => {
    const fn = jest.fn(() => Promise.resolve('test'))
    const lazyFn = lazy(fn)
    expect(await lazyFn()).toBe('test')
    expect(await lazyFn()).toBe('test')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
