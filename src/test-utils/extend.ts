//istanbul ignore next
expect.extend({
  toBeIn(received, expected) {
    const pass = expected.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be in ${expected}`,
        pass,
      }
    } else {
      return {
        message: () => `expected ${received} to be in ${expected}`,
        pass,
      }
    }
  },
})
