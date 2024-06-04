import { requireEnvVariables } from './env'

describe('requireEnvVariables', () => {
  it('should throw error if env variable is not set', () => {
    const env = process.env
    process.env = {}
    expect(() => requireEnvVariables(['TEST'])).toThrowError(
      'Environment variable "TEST" is not set',
    )
    process.env = env
  })

  it('should return env variables', () => {
    const env = process.env
    process.env = { TEST: 'test' }
    expect(requireEnvVariables(['TEST'])).toEqual({ TEST: 'test' })
    process.env = env
  })

  it('should return multiple env variables ', () => {
    const env = process.env
    process.env = { TEST: 'test', DEFAULT: 'default' }
    expect(requireEnvVariables(['TEST', 'DEFAULT'])).toEqual({
      TEST: 'test',
      DEFAULT: 'default',
    })
    process.env = env
  })
})
