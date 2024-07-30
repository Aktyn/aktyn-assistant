export function once<ArgsType extends Array<unknown>, ResultType>(
  fn: (...args: ArgsType) => ResultType,
) {
  let result: ResultType
  let executed = false
  return (...args: ArgsType) => {
    if (executed) {
      return result
    }

    if (result === undefined) {
      result = fn(...args)
    }
    executed = true
    return result
  }
}

export const isDev = once(() => process.env.NODE_ENV?.toLowerCase() === 'dev')

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export function zip<T extends unknown[][]>(
  ...arrays: T
): { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] {
  if (arrays.length === 0) {
    return []
  }

  const maxLength = Math.max(...arrays.map((arr) => arr.length))
  const result: { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] = []

  for (let i = 0; i < maxLength; i++) {
    const group: { [K in keyof T]: T[K] extends (infer U)[] ? U : never } =
      arrays.map((arr) => arr[i]) as {
        [K in keyof T]: T[K] extends (infer U)[] ? U : never
      }
    result.push(group)
  }

  return result
}

export function cmp(a: string, b: string) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++
  }
  return i
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes <= 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function trimString(str: string, maxLength: number, suffix = '...') {
  if (str.length <= maxLength) {
    return str
  }

  return str.slice(0, maxLength - suffix.length) + suffix
}
