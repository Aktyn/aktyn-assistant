import { cmp, formatBytes, once, trimString, wait, zip } from './misc'

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

describe(zip.name, () => {
  it('should zip arrays', () => {
    expect(zip([1, 2, 3], ['a', 'b', 'c'])).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ])
  })

  it('should zip empty arrays', () => {
    expect(zip([], [])).toEqual([])
  })

  it('should zip single array', () => {
    expect(zip([1, 2, 3])).toEqual([[1], [2], [3]])
  })

  it('should zip multiple arrays', () => {
    expect(zip([1, 2, 3], ['a', 'b', 'c'], [true, false])).toEqual([
      [1, 'a', true],
      [2, 'b', false],
      [3, 'c', undefined],
    ])
  })
})

describe(cmp.name, () => {
  it('should compare strings', () => {
    expect(cmp('abc', 'abc')).toBe(3)
    expect(cmp('abc', 'abd')).toBe(2)
    expect(cmp('abd', 'abc')).toBe(2)
    expect(cmp('abc', 'def')).toBe(0)
    expect(cmp('def', 'abc')).toBe(0)
  })
})

describe(formatBytes.name, () => {
  it('should format bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024 * 2)).toBe('2 MB')
    expect(formatBytes(1024 * 1024 * 1024 * 3)).toBe('3 GB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 4.5)).toBe('4.5 TB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024 * 5.67)).toBe('5.67 PB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 6.789)).toBe(
      '6.79 EB',
    )
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe(
      '1 ZB',
    )
    expect(
      formatBytes(1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024),
    ).toBe('1 YB')
  })

  it('should format bytes with decimals', () => {
    expect(formatBytes(0, 1)).toBe('0 Bytes')
    expect(formatBytes(1536, 1)).toBe('1.5 KB')
    expect(formatBytes(1337, 2)).toBe('1.31 KB')
  })
})

describe(trimString.name, () => {
  it('should trim string with suffix', () => {
    expect(trimString('foo bar', 3, '...')).toBe('...')
    expect(trimString('foo bar', 4, '...')).toBe('f...')
    expect(trimString('foo bar', 5, '...')).toBe('fo...')
    expect(trimString('foo bar', 6, '...')).toBe('foo...')
    expect(trimString('foo bar', 7, '...')).toBe('foo bar')
    expect(trimString('foo bar', 8, '...')).toBe('foo bar')
  })
})
