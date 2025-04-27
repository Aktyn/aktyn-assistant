export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function waitFor(
  condition: () => boolean,
  timeout = 10_000,
  stepDelay = 100,
) {
  if (condition()) {
    return
  }

  const startTime = Date.now()
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout')
    }
    await wait(stepDelay)
  }
}
