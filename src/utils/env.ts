import * as dotenv from 'dotenv'
import { expand } from 'dotenv-expand'

import { lazy } from './common'

const sync = lazy(() => {
  expand(dotenv.config())
})

export function requireEnvVariables<K extends string>(keys: K[]) {
  sync()

  const result = {} as { [key in K]: string }
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Environment variable "${key}" is not set`)
    }

    result[key] = process.env[key] as string
  }

  return result
}
