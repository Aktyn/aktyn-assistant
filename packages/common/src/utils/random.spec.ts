import { describe, it, expect } from 'vitest'

import { randomInt } from './random'

describe(randomInt.name, () => {
  it('should return random integer between min and max', () => {
    const min = 0
    const max = 10

    for (let i = 0; i < 100; i++) {
      const int = randomInt(min, max)
      expect(int).toBeGreaterThanOrEqual(min)
      expect(int).toBeLessThanOrEqual(max)
    }
  })
})
