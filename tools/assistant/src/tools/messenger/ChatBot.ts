import { type CookieParam, type ElementHandle, type Page } from 'puppeteer'

import { wait, waitFor } from '../../common/utils'

import { Bot, getRandomTypeDelay } from './Bot'

const baseUrl = 'https://www.facebook.com'

type ThreadInfo = {
  name: string
  href: string
  rowElement: ElementHandle<HTMLDivElement>
}

export type MessengerCredentials =
  | {
      username: string
      password: string
    }
  | {
      /** Cookies string that can be obtained by running `document.cookie` in browser console */
      cookies: string
    }
export type MessageInfo = {
  received: boolean
  content: string
  unread: boolean
}

export class ChatBot extends Bot {
  //TODO: load from external config file
  private static readonly selectors = {
    allowCookiesButton:
      "body > div > div > div > div > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div[role='button']",
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="pass"]',
    loginButton: "button[name='login']",
    recentThreadsList:
      'div > div > div > div > div > div:nth-child(2) > div > div > div > div > div[role=row]',
    recentThreadsListItemName:
      'div:nth-child(1) > div > div > div > a > div > div > div > div > div > div > span > span',
    recentThreadsListItemLink: 'a',
    chatInput:
      'body > div > div > div:nth-child(1) > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div > div > div > div > div > div',
    unreadMessagesIndicator: 'div[data-visualcompletion="ignore"]',
    messagesList:
      "div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > div > span > div > div > div[role='presentation']",
  } as const

  protected isLoginInProgress = false
  protected loginSuccess = false
  private recentThreads: Array<ThreadInfo> = []
  private listeningForNewMessages = false

  constructor(
    private readonly credentials: MessengerCredentials,
    private readonly recentThreadsLimit = 10,
    userDataPath?: string,
  ) {
    super({
      userDataDir: userDataPath,
    })
  }

  protected async postInit(page: Page) {
    try {
      if ('cookies' in this.credentials) {
        const parsedCookies = this.credentials.cookies
          .split(';')
          .map((cookie) => {
            const [name, value] = cookie.trim().split('=')
            return {
              name,
              value,
              url: baseUrl,
              domain: '.facebook.com',
              path: '/',
            } satisfies CookieParam
          })
        await page.setCookie(...parsedCookies)
      }
    } catch (error) {
      console.error(error)
    }
  }

  private async acceptCookies() {
    if (!this.page) {
      throw new Error('ChatBot initialization failed')
    }
    const allowCookiesButton = await this.page.$(
      ChatBot.selectors.allowCookiesButton,
    )
    if (allowCookiesButton) {
      console.info('Clicking allow cookies button')
      await allowCookiesButton.click()
    }
  }

  public async login() {
    if (this.isLoginInProgress) {
      throw new Error('Login is already in progress')
    }
    this.isLoginInProgress = true

    try {
      await waitFor(() => this.ready, 60_000)
      if (this.initError || !this.page) {
        throw new Error('ChatBot initialization failed')
      }

      console.info('Navigating to base page')
      await this.page.goto(`${baseUrl}/messages/t/null`, {
        waitUntil: 'networkidle0',
      })
      await super.waitShortlyForNetworkIdle()

      const emailInput: ElementHandle<HTMLInputElement> | null =
        await this.page.$(ChatBot.selectors.emailInput)
      const passwordInput: ElementHandle<HTMLInputElement> | null =
        await this.page.$(ChatBot.selectors.passwordInput)

      if (emailInput && passwordInput) {
        if ('cookies' in this.credentials) {
          throw new Error('Incorrect session in cookies')
        }

        await this.acceptCookies()

        await wait(1_000)
        console.info('Typing username')
        await super.typeValue(emailInput, this.credentials.username, true)

        await wait(1_000)
        console.info('Typing password')
        await super.typeValue(passwordInput, this.credentials.password, true)

        await wait(1_000)
        const loginButton = await this.page.$(ChatBot.selectors.loginButton)
        if (!loginButton) {
          throw new Error('Login button not found')
        }
        console.info('Clicking login button')
        await wait(1_000)
        await loginButton.click({ delay: 100 })
        await super.waitForNavigation()
        await super.waitShortlyForNetworkIdle(10_000)
      }

      try {
        if (!new URL(this.page.url()).pathname.startsWith('/messages')) {
          console.info('Navigating to messages page')
          await wait(1_000)
          await this.page.goto(`${baseUrl}/messages/t/null`, {
            waitUntil: 'networkidle0',
          })
        }
      } catch (error) {
        console.error(error)
      }

      await super.waitShortlyForNetworkIdle()
      await wait(1000)
      await this.acceptCookies()

      this.loginSuccess = true
    } catch (error) {
      this.loginSuccess = false
      throw error
    }

    this.isLoginInProgress = false
  }

  private async queryRecentThreadsList() {
    return (await this.page?.$$(ChatBot.selectors.recentThreadsList)) ?? []
  }

  public listenForNewMessages(
    callback: (thread: ThreadInfo, messages: Array<MessageInfo>) => void,
  ) {
    if (this.listeningForNewMessages) {
      throw new Error('Listening for new messages is already in progress')
    }

    this.listeningForNewMessages = true

    //TODO: init faze that reads last messages of every recent thread

    return setInterval(() => {
      if (!this.page?.url().startsWith(`${baseUrl}/messages`)) {
        return
      }

      this.readNewMessage()
        .then((data) => {
          if (data) {
            callback(data.thread, data.lastMessages)
          }
        })
        .catch(console.error)
    }, 5_000)
  }

  private async readNewMessage() {
    const recentThreads = await this.getRecentThreads()
    for (const thread of recentThreads) {
      const _unreadMessagesIndicator = await thread.rowElement.$(
        ChatBot.selectors.unreadMessagesIndicator,
      )
      //TODO: uncomment after implementing rest of the logic
      // if (!unreadMessagesIndicator) {
      //   continue
      // }
      //TODO: remove
      if (thread.name !== 'Horizamian') {
        continue
      }

      await this.goToThread(thread, true)
      await super.waitShortlyForNetworkIdle(2_000)

      //TODO: retrieve timestamp, save last messages scan timestamp; in case there is no timestamp, 16 last messages will be retrieved and AI will be instructed to summarize only those from last minute
      //TODO: temporary locking navigation during some operations (enum with currently performing operation like READING_NEW_MESSAGES, SENDING_MESSAGE, etc)
      const messagesList = await this.page!.$$(ChatBot.selectors.messagesList)

      const maxPreviousMessages = 16
      const messages: MessageInfo[] = []
      for (let i = messagesList.length - 1; i >= 0; i--) {
        const [content, isReceivedMessage] = await messagesList[i].evaluate(
          (element) => {
            const content = element.innerText.trim()
            if (!content) {
              return [content, false] as const
            }

            const backgroundColor = window
              .getComputedStyle(element)
              .getPropertyValue('background-color')
            return [
              content,
              Boolean(
                backgroundColor === 'rgb(48, 48, 48)' ||
                  backgroundColor === 'rgb(240, 240, 240)',
              ),
            ] as const
          },
        )

        if (!content) {
          continue
        }

        messages.push({
          received: isReceivedMessage,
          content,
          unread: isReceivedMessage && true, //TODO: implement
        })
        if (messages.length >= maxPreviousMessages) {
          break
        }
      }
      messages.reverse()

      return { lastMessages: messages, thread }
    }
    return null
  }

  @waitForLogin
  public async getRecentThreads() {
    const list = (await this.queryRecentThreadsList()).slice(
      0,
      this.recentThreadsLimit,
    )

    const threads = await Promise.all(
      list.map(async (element) => {
        const nameElement = await element.$(
          ChatBot.selectors.recentThreadsListItemName,
        )
        const link = await element.$(
          ChatBot.selectors.recentThreadsListItemLink,
        )

        if (!link || !nameElement) {
          return null
        }

        const name = await nameElement.evaluate((element) => element.innerText)
        const href = await link.evaluate((a) => a.href)
        return {
          name,
          href,
          rowElement: element,
        }
      }),
    )

    this.recentThreads = threads.filter((thread) => thread !== null)
    return this.recentThreads
  }

  private isPageOnThread(thread: ThreadInfo) {
    try {
      if (this.page && new URL(this.page.url()).href.startsWith(thread.href)) {
        console.info('Page is already on the thread')
        return true
      }
    } catch (error) {
      console.error(error)
    }
    return false
  }

  @waitForLogin
  public async goToThread(thread: ThreadInfo, waitForChatInput = true) {
    if (this.isPageOnThread(thread)) {
      if (waitForChatInput) {
        await this.page!.waitForSelector(ChatBot.selectors.chatInput)
      }
      return
    }

    const list = await this.queryRecentThreadsList()
    for (const element of list) {
      const link = await element.$(ChatBot.selectors.recentThreadsListItemLink)
      if (link && (await link.evaluate((a) => a.href)) === thread.href) {
        await link.click({ delay: 100 })
        await super.waitForNavigation()
        if (waitForChatInput) {
          await this.page!.waitForSelector(ChatBot.selectors.chatInput)
        }
        return
      }
    }
  }

  @waitForLogin
  public async typeMessageAndSend(message: string) {
    const input = await this.page!.$(ChatBot.selectors.chatInput)
    if (!input) {
      throw new Error('Chat input not found')
    }

    await input.type(message, { delay: getRandomTypeDelay() })
    await input.press('Enter')
  }
}

function waitForLogin(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value
  if (typeof originalMethod !== 'function') {
    throw new Error('assertLoggedIn decorator can only be used on methods')
  }

  descriptor.value = async function (this: ChatBot, ...args: unknown[]) {
    await waitFor(() => this.ready, 60_000)
    if (this.initError || !this.browser || !this.page) {
      throw new Error('ChatBot initialization failed')
    }
    await waitFor(() => !this.isLoginInProgress, 60_000)
    if (!this.loginSuccess) {
      throw new Error('Login failed')
    }
    return originalMethod.apply(this, args)
  }
}
