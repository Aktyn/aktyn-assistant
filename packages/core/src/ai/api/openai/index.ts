import { isDev, once } from '@aktyn-assistant/common'
import { notify } from 'node-notifier'
import { OpenAI } from 'openai'

import { loadProviderApiKey, removeProviderApiKey, saveProviderApiKey } from '../common'

export * from './chat'
export * from './models'

const keyFileName = 'openai-key.json'

async function setup() {
  let apiKey = loadProviderApiKey(keyFileName)
  while (!apiKey) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore //TODO
    apiKey = (await requestApiKey('OpenAI')) ?? ''
  }

  saveProviderApiKey(keyFileName, apiKey)

  try {
    const client = new OpenAI({
      apiKey,
    })
    await client.models.list() // Example call to check if API key is valid
    return client
  } catch (error) {
    if (isDev()) {
      console.error(error)
    }
    // printError({ //TODO
    //   title: `Invalid OpenAI API key: "${apiKey}"`,
    //   message: 'Please try again or press CTRL+C to exit',
    // })
    try {
      removeProviderApiKey(keyFileName)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
    return await setup()
  }
}

export const getOpenAiClient = once(async () => {
  try {
    return await setup()
  } catch (error) {
    notify({
      title: 'OpenAI setup fatal error',
      message: error instanceof Error ? error.message : undefined,
    })
    console.error(error)
    process.exit(1)
  }
})
