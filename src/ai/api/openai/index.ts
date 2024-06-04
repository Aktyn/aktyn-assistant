import { notify } from 'node-notifier'
import { OpenAI } from 'openai'

import { once } from '../../../utils/common'
import { requireEnvVariables } from '../../../utils/env'

export * from './chat'
export * from './models'

//istanbul ignore next
export const getOpenAiClient = once(() => {
  try {
    const requiredEnvs = requireEnvVariables([
      'OPENAI_API_KEY',
      'OPENAI_PROJECT_ID',
      'OPENAI_ORGANIZATION_ID',
    ])

    return new OpenAI({
      apiKey: requiredEnvs.OPENAI_API_KEY,
      project: requiredEnvs.OPENAI_PROJECT_ID,
      organization: requiredEnvs.OPENAI_ORGANIZATION_ID,
    })
  } catch (error) {
    console.error(error)
    notify({
      title: 'OpenAI error',
      message: error instanceof Error ? error.message : undefined,
    })
    process.exit(1)
  }
})
