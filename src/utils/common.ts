export function once<T>(fn: () => T): () => T {
  let result: T
  let executed = false
  return () => {
    if (executed) {
      return result
    }

    if (result === undefined) {
      result = fn()
    }
    executed = true
    return result
  }
}
