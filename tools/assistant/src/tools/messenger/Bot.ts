import {
  launch,
  type Browser,
  type ElementHandle,
  type LaunchOptions,
  type Page,
  type Viewport,
} from 'puppeteer'

export const getRandomTypeDelay = () => Math.random() * 100 + 50

export abstract class Bot {
  protected static defaultViewport: Viewport = {
    width: 1280,
    height: 720,
    isMobile: false,
    isLandscape: true,
    hasTouch: false,
  }

  protected ready = false
  protected initError = false
  protected browser: Browser | null = null
  protected page: Page | null = null

  constructor(options: Partial<LaunchOptions> = {}) {
    this.init(options)
      .catch((error) => {
        console.error(error)
        this.initError = true
      })
      .finally(() => {
        console.info('Bot initialized')
        this.ready = true
      })
  }

  private async init(options: Partial<LaunchOptions> = {}) {
    this.browser = await launch({
      headless: false, //TODO: make it configurable though env variable
      browser: 'chrome',
      channel: 'chrome',
      timeout: 50_000,
      waitForInitialPage: true,
      args: [
        // '--start-maximized',
        '--disable-infobars',
        '--no-default-browser-check',
        // '--lang=en-US,en',
      ],
      ignoreDefaultArgs: [
        '--enable-automation',
        '--enable-blink-features=IdleDetection',
        '--disable-blink-features=AutomationControlled',
      ],
      devtools: process.env.ENVIRONMENT === 'dev',
      defaultViewport: Bot.defaultViewport,
      ...options,
    })
    const pages = await this.browser.pages()
    this.page = pages[0] ?? (await this.browser.newPage())
    await this.page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    )
    await this.page.setViewport(Bot.defaultViewport)

    await this.postInit(this.page)
  }

  protected abstract postInit(page: Page): Promise<void>

  @assertReady
  public async typeValue(
    target: string | ElementHandle<HTMLInputElement>,
    value: string,
    clear?: boolean,
  ) {
    const input =
      typeof target === 'string'
        ? ((await this.page!.$(
            target,
          )) as ElementHandle<HTMLInputElement> | null)
        : target
    if (!input) {
      throw new Error('Input not found')
    }

    if (clear) {
      try {
        await input.evaluate((el) => (el.value = ''))
      } catch {
        //noop
      }
    }
    await input.type(value, { delay: getRandomTypeDelay() })
  }

  @assertReady
  public async waitForNavigation(timeout = 20_000) {
    try {
      await this.page!.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout,
      })
    } catch (error) {
      console.error(error)
    }
  }

  @assertReady
  public async waitShortlyForNetworkIdle(timeout = 1_000) {
    try {
      await this.page!.waitForNetworkIdle({ timeout })
    } catch {
      //noop
    }
  }
}

function assertReady(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value
  if (typeof originalMethod !== 'function') {
    throw new Error('assertReady decorator can only be used on methods')
  }

  descriptor.value = async function (this: Bot, ...args: unknown[]) {
    if (!this.ready || !this.browser || !this.page || this.initError) {
      throw new Error('Bot is not ready or initialization failed')
    }
    return originalMethod.apply(this, args)
  }
}
