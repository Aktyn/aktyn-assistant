import { notify } from 'node-notifier'
import { OpenAI } from 'openai' //TODO: make sure that disabling eslint rule is necessary

import { requireEnvVariables } from './utils/env'

const requiredEnvs = requireEnvVariables([
  'OPENAI_API_KEY',
  'OPENAI_PROJECT_ID',
  'OPENAI_ORGANIZATION_ID',
])

// TODO: option for selecting rectangular part of screen before asking question about it

const openai = new OpenAI({
  apiKey: requiredEnvs.OPENAI_API_KEY,
  project: requiredEnvs.OPENAI_PROJECT_ID,
  organization: requiredEnvs.OPENAI_ORGANIZATION_ID,
})

async function main() {
  const completionsStream = await openai.chat.completions.create({
    // model: 'gpt-3.5-turbo', //TODO: allow user to select model
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say this is a test' }], // and count to 10
    stream: true,
  })
  //TODO: allow to cancel stream
  for await (const chunk of completionsStream) {
    console.log(chunk.choices[0]?.delta?.content || '', Date.now())
  }
}

function handleOpenAiError(error: unknown) {
  //TODO: display error message as system notification
  console.error(error)
  notify({
    title: 'OpenAI error',
    message: error instanceof Error ? error.message : undefined,
  })
}

main().catch(handleOpenAiError)
