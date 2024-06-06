import type { ChatStream } from '@aktyn-assistant/common'
import { terminal } from 'terminal-kit'
import type { AnimatedText } from 'terminal-kit/Terminal'

import { printError } from './error'

enum INTERFACE_VIEW {
  Chat = 'chat',
  Settings = 'settings',
}

const menu: { [key in INTERFACE_VIEW]: { key: key; label: string } } = {
  [INTERFACE_VIEW.Chat]: {
    key: INTERFACE_VIEW.Chat,
    label: 'Chat',
  },
  [INTERFACE_VIEW.Settings]: {
    key: INTERFACE_VIEW.Settings,
    label: 'Settings',
  },
}

export class TerminalInterface {
  private static maxHeight = 48

  private realWidth = terminal.width
  private realHeight = terminal.height
  private view: INTERFACE_VIEW | null = null
  private shown = false

  private keyListener = this.onKey.bind(this)

  private spinner: AnimatedText | null = null
  private chatStream: InstanceType<typeof ChatStream> | null = null
  private abortChatMessageInput: (() => void) | null = null

  private get width() {
    return this.realWidth
  }
  private get height() {
    return Math.min(this.realHeight, TerminalInterface.maxHeight)
  }

  constructor(
    private readonly listeners: {
      onChatMessage: (message: string) => Promise<InstanceType<typeof ChatStream>>
    },
  ) {
    terminal.on('resize', (width: number, height: number) => {
      this.realWidth = width
      this.realHeight = height
      if (this.shown) {
        this.showInterface()
      }
    })
  }

  private abortAsynchronousActions() {
    if (this.spinner) {
      this.spinner.animate(false)
      this.spinner = null
    }
    if (this.chatStream) {
      this.chatStream.controller.abort('User aborted')
      this.chatStream = null
    }
    if (this.abortChatMessageInput) {
      this.abortChatMessageInput()
      this.abortChatMessageInput = null
    }
  }

  private onKey(key: string) {
    switch (key) {
      case 'ESCAPE':
        if (this.view) {
          this.view = null
          this.showInterface()
          this.abortAsynchronousActions()
        }
        break
      case 'ENTER':
        //TODO: implement
        break
    }
  }

  private handleError(error: unknown) {
    this.abortAsynchronousActions()
    this.showInterface()
    terminal.moveTo(1, 1)
    printError({
      title: 'Error',
      message: error instanceof Error ? error.message : undefined,
    })
  }

  showInterface() {
    if (!this.shown) {
      terminal.on('key', this.keyListener)
    }

    this.shown = true

    terminal.reset()
    terminal.clear().eraseDisplay().moveTo(1, 1)
    try {
      terminal.resetScrollingRegion()
      terminal.scrollingRegion(0, this.height - 1)
    } catch {
      //ignore
    }
    if (this.view === null) {
      this.renderMenu()
    } else {
      this.renderInterfaceView(this.view)
    }
  }

  hideInterface() {
    if (!this.shown) {
      return
    }
    this.shown = false
    terminal.off('key', this.keyListener)
    terminal.clear()
  }

  private renderMenu() {
    terminal.eraseDisplay()
    terminal.moveTo(1, 1)

    const items = Object.values(menu)
    terminal.bold('Select option:')
    if (process.env.NODE_ENV?.toLowerCase() === 'dev') {
      terminal(
        ` Environment: ${process.env.NODE_ENV} | Terminal width: ${this.realWidth} | Terminal height: ${this.realHeight} | Interface size: ${this.width} x ${this.height}`,
      )
    }
    terminal('\n')
    terminal.gridMenu(
      items.map((entry) => entry.label),
      {
        width: this.width,
        leftPadding: ' ',
        rightPadding: ' ',
        exitOnUnexpectedKey: true,
        selectedStyle: terminal.brightCyan.bold.inverse,
      },
      (error, response) => {
        if (error) {
          this.handleError(error)
          return
        }

        if (typeof response.selectedIndex === 'number') {
          this.view = items[response.selectedIndex].key
        }
        this.showInterface()
      },
    )
  }

  private renderInterfaceView(view: INTERFACE_VIEW) {
    switch (view) {
      case INTERFACE_VIEW.Chat:
        this.openChatView()
        break
      case INTERFACE_VIEW.Settings:
        terminal.eraseDisplay()
        this.showEscapeToReturnToMenuInfo()
        terminal.moveTo(1, this.height - 2).defaultColor('TODO: settings panel') //TODO: implement
        break
    }
  }

  private showEscapeToReturnToMenuInfo() {
    terminal.moveTo(1, this.height - 1)
    terminal.eraseLine().yellow.bold('Press ESC to return to menu')
  }

  private openChatView() {
    terminal.eraseDisplay()
    this.requestChatMessage()
  }

  private requestChatMessage() {
    this.showEscapeToReturnToMenuInfo()

    terminal.moveTo(1, this.height - 3).gray(Array.from({ length: this.width }, () => '-').join(''))
    const messageInfo = 'Type your message: '
    terminal.moveTo(1, this.height - 2).gray(messageInfo)

    const { abort } = terminal.inputField(
      {
        cancelable: true,
        maxLength: this.width - messageInfo.length,
      },
      (error, value) => {
        if (error) {
          this.handleError(error)
          return
        }

        value = value?.trim() ?? ''
        this.abortChatMessageInput = null
        if (value) {
          this.handleMessageInput(value).catch(() => process.exit(1))
        } else {
          terminal.eraseLine()
          this.requestChatMessage()
        }
      },
    )
    this.abortChatMessageInput = abort
  }

  private async handleMessageInput(message: string) {
    terminal.moveTo(1, this.height - 1).defaultColor('\n')
    this.showEscapeToReturnToMenuInfo()
    terminal.moveTo(1, this.height - 2).eraseLine()
    this.spinner = await terminal.gray('Awaiting response ').spinner()

    try {
      const stream = (this.chatStream = await this.listeners.onChatMessage(message))
      for await (const chunk of stream) {
        if (stream.controller.signal.aborted) {
          break
        }
        console.log(chunk.content) //TODO: print dynamically
      }
      this.chatStream = null
    } catch (error) {
      this.handleError(error)
    }

    this.spinner.animate(false)
    this.spinner = null
  }
}
