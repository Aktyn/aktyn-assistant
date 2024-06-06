import fs from 'fs'
import path from 'path'

import { printError, requestApiKey } from '@aktyn-assistant/terminal-interface'
import { notify } from 'node-notifier'
import { OpenAI } from 'openai'

import { isDev, once } from '../../../utils/common'
import { getConfigDirectory } from '../../../utils/user-config'

export * from './chat'
export * from './models'

async function setup() {
  const keyFilePath = path.join(getConfigDirectory(), 'openai-key.json')
  let apiKey = loadApiKey(keyFilePath)
  while (!apiKey) {
    apiKey = (await requestApiKey('OpenAI')) ?? ''
  }

  if (!fs.existsSync(path.dirname(keyFilePath))) {
    fs.mkdirSync(path.dirname(keyFilePath), { recursive: true })
  }
  fs.writeFileSync(keyFilePath, apiKey, 'utf8')

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
    printError({
      title: `Invalid OpenAI API key: "${apiKey}"`,
      message: 'Please try again or press CTRL+C to exit',
    })
    try {
      fs.unlinkSync(keyFilePath)
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

function loadApiKey(path: string) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch {
    return null
  }
}
