import type { InterfaceAPI } from '@aktyn-assistant/common'
import { terminal } from 'terminal-kit'

import { ChatView } from './chatView'
import { SettingsView } from './settingsView'
import { INTERFACE_VIEW, type View } from './view'

const menu: { [key in INTERFACE_VIEW]: { type: key; label: string } } = {
  [INTERFACE_VIEW.Chat]: {
    type: INTERFACE_VIEW.Chat,
    label: 'Chat',
  },
  [INTERFACE_VIEW.Settings]: {
    type: INTERFACE_VIEW.Settings,
    label: 'Settings',
  },
}

export class TerminalInterface {
  private width = terminal.width
  private height = terminal.height
  private view: View | null = null
  private shown = false

  private keyListener = this.onKey.bind(this)

  constructor(private readonly listeners: InterfaceAPI) {
    terminal.on('resize', (width: number, height: number) => {
      this.width = width
      this.height = height
      if (this.shown) {
        this.showInterface()
      }
    })
  }

  private closeView() {
    if (this.view) {
      this.view.abortAsynchronousActions()
      this.view = null
      this.showInterface()
    }
  }

  private onKey(key: string) {
    switch (key) {
      case 'ESCAPE':
        this.closeView()
        break
    }
  }

  private handleError(error: unknown) {
    this.view?.abortAsynchronousActions()
    this.view = null
    this.showInterface()
    terminal.notify('Error', error instanceof Error ? error.message : '---')
  }

  showInterface() {
    if (!this.shown) {
      terminal.on('key', this.keyListener)
    }
    this.shown = true

    try {
      terminal.reset()
      terminal.clear().eraseDisplay().moveTo(1, 1)
      terminal.resetScrollingRegion()
      terminal.scrollingRegion(0, this.height - 1)
    } catch {
      //ignore
    }

    if (this.view) {
      this.view.open()
    } else {
      this.renderMenu()
    }
  }

  hideInterface() {
    if (!this.shown) {
      return
    }
    this.shown = false

    this.view?.abortAsynchronousActions()
    this.view = null

    terminal.off('key', this.keyListener)
    terminal.clear()
  }

  private renderMenu() {
    terminal.clear()
    terminal.moveTo(1, this.height - 1)

    const items = Object.values(menu)
    terminal.bold('Select option:')
    if (process.env.NODE_ENV?.toLowerCase() === 'dev') {
      terminal(
        ` Environment: ${process.env.NODE_ENV} | Terminal width: ${this.width} | Terminal height: ${this.height}`,
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
          const viewType = items[response.selectedIndex].type
          switch (viewType) {
            case INTERFACE_VIEW.Chat:
              this.view = new ChatView(viewType, this.handleError.bind(this), noop, this.listeners)
              break
            case INTERFACE_VIEW.Settings:
              this.view = new SettingsView(
                viewType,
                this.handleError.bind(this),
                this.closeView.bind(this),
                this.listeners,
              )
              break
          }
        }
        this.showInterface()
      },
    )
  }
}

const noop = () => void 0
