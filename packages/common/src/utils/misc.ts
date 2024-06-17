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
