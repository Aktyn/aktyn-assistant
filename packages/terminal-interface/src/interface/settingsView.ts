import { terminal } from 'terminal-kit'

import { selectOption, selectYesOrNo } from '../select'

import { View } from './view'

enum SETTINGS_ITEM {
  MockPaidRequests = 'Mock paid requests',
  SelectChatModel = 'Select chat model',
  // ClearApiKeys = 'Clear API keys', //TODO: implement
}

export class SettingsView extends View {
  private aborted = false

  abortAsynchronousActions() {
    this.aborted
  }

  open() {
    this.showSettings()
  }

  private showSettings() {
    terminal.eraseDisplay()

    terminal.moveTo(1, terminal.height - 1)
    terminal.bold('Which settings do you want to change?')

    const items = Object.values(SETTINGS_ITEM)
    terminal.gridMenu(
      [...items, 'Return to menu'],
      {
        leftPadding: ' ',
        rightPadding: ' ',
        exitOnUnexpectedKey: true,
        selectedStyle: terminal.brightCyan.bold.inverse,
      },
      (error, response) => {
        if (this.aborted) {
          return
        }

        if (error) {
          this.handleError(error)
          return
        }

        if (response.selectedIndex === items.length || typeof response.selectedIndex !== 'number') {
          this.onReturnToMenu()
        } else {
          const item = items[response.selectedIndex]
          switch (item) {
            case SETTINGS_ITEM.MockPaidRequests:
              this.selectMockPaidRequests().catch(this.handleError)
              break
            case SETTINGS_ITEM.SelectChatModel:
              this.selectChatModel().catch(this.handleError)
              break
          }
        }
      },
    )
  }

  private async selectMockPaidRequests() {
    terminal.clear()
    terminal.moveTo(1, terminal.height - 1)

    const mock = await selectYesOrNo('Do you want to mock paid requests to AI provider?')
    if (this.aborted) {
      return
    }
    this.api.settings.set('mockPaidRequests', mock)
    this.showSettings()
  }

  private async selectChatModel() {
    terminal.clear()

    const models = await this.api.ai.requestChatModels()
    terminal.moveTo(1, terminal.height - 1 - models.length)

    terminal('Current chat model: ').bold(this.api.settings.get('selectedChatModel'))
    const selectedModel = await selectOption(models.sort(), 'Select chat model:')
    if (this.aborted) {
      return
    }
    this.api.settings.set('selectedChatModel', selectedModel)
    this.showSettings()
  }
}
