import { logger, type AI } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { ChatView } from './chatView'
import { clearTerminal } from './common'
import { InfoView } from './infoView'
import { SettingsView } from './settingsView'
import { ToolsView } from './toolsView'
import { InterfaceView, type View } from './view'
import { VoiceChatView } from './voiceChatView'

const menu = {
  [InterfaceView.Chat]: {
    type: InterfaceView.Chat,
    label: 'Chat',
    Class: ChatView,
  },
  [InterfaceView.VoiceChat]: {
    type: InterfaceView.VoiceChat,
    label: 'Voice chat',
    Class: VoiceChatView,
  },
  [InterfaceView.Tools]: {
    type: InterfaceView.Tools,
    label: 'Tools',
    Class: ToolsView,
  },
  [InterfaceView.Settings]: {
    type: InterfaceView.Settings,
    label: 'Settings',
    Class: SettingsView,
  },
  [InterfaceView.Info]: {
    type: InterfaceView.Info,
    label: 'Info',
    Class: InfoView,
  },
} as const satisfies {
  [key in InterfaceView]: { type: key; label: string; Class: typeof View }
}

export class TerminalInterface {
  private width = terminal.width
  private height = terminal.height
  private view: View | null = null
  private shown = false

  private keyListener = this.onKey.bind(this)

  constructor(private readonly ai: AI) {
    terminal.on('resize', (width: number, height: number) => {
      this.width = width
      this.height = height

      logger.info(`Terminal resized to ${width}x${height}`)

      if (this.shown) {
        this.showInterface()
      }
    })

    logger.info(
      `Environment: ${process.env.NODE_ENV} | Terminal width: ${this.width} | Terminal height: ${this.height}`,
    )
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
    clearTerminal()
    terminal.moveTo(1, this.height - 2)

    const items = Object.values(menu)
    terminal.bold('Select option:')
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
          this.view = new menu[viewType].Class(
            viewType,
            this.handleError.bind(this),
            this.closeView.bind(this),
            this.ai,
          )
        }
        this.showInterface()
      },
    )
  }
}
