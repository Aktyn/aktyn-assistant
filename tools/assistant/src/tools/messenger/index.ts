import type { Tool, ToolSchema } from '@aktyn-assistant/common'

import { ChatBot, type MessengerCredentials } from './ChatBot'

//TODO: regenerate paths as separate program (regenerate paths to elements in puppeteer with llama)

const toolSchema: ToolSchema = {
  version: '1.0.5',
  functionName: 'send_chat_message',
  description: 'Send chat message to selected person',
  parameters: {
    type: 'object',
    properties: {
      recipient: {
        type: 'string', //TODO: consider dynamically generated enum with target names
        description: 'Name of the recipient',
      },
      message: {
        type: 'string',
        description: 'Content of the message',
      },
    },
    required: ['recipient', 'message'],
  },
}

type MessengerParameters = { recipient: string; message: string }

async function sendChatMessage(
  { recipient, message }: MessengerParameters,
  bot: ChatBot,
) {
  const recentThreads = await bot.getRecentThreads()

  const target = recentThreads.find((thread) =>
    thread.name.toLowerCase().includes(recipient.toLowerCase()),
  )
  if (!target) {
    return `Recipient "${recipient}" not found\nAvailable recipients: ${recentThreads.map((thread) => `"${thread.name}"`).join(', ')}`
  }

  console.info(`Navigating to thread: ${target.name}`)
  await bot.goToThread(target)
  await bot.typeMessageAndSend(message)

  return `Message successfully sent to ${target.name}`
}

export type MessengerToolInitParameters = {
  userDataPath?: string
} & MessengerCredentials

export function getMessengerTool(initParameters: MessengerToolInitParameters) {
  if (
    !('cookies' in initParameters && initParameters.cookies?.length) &&
    !(
      'username' in initParameters &&
      'password' in initParameters &&
      initParameters.username?.length &&
      initParameters.password?.length
    )
  ) {
    throw new Error(
      'Messenger session cookies or username and password must be provided',
    )
  }

  const bot = new ChatBot(
    'cookies' in initParameters && initParameters.cookies?.length
      ? {
          cookies: initParameters.cookies,
        }
      : 'username' in initParameters && 'password' in initParameters
        ? {
            username: initParameters.username,
            password: initParameters.password!,
          }
        : ({} as never),
    10,
    initParameters.userDataPath,
  )
  bot.login().catch(console.error)

  bot.listenForNewMessages((thread, messages) => {
    console.info(
      `New message from ${thread.name}: "${JSON.stringify(messages, null, 2)}"`,
    )
  })

  return {
    schema: toolSchema,
    function: (data) => sendChatMessage(data, bot),
    //TODO: additional actions: SETUP (terminal interface on raspberry pi)
  } satisfies Tool<MessengerParameters>
}
