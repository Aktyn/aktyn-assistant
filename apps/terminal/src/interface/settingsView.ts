import { getUserConfigValue, setUserConfigValue } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { selectOption, selectYesOrNo } from '../select'

import { View } from './view'

enum SETTINGS_ITEM {
  MockPaidRequests = 'Mock paid requests',
  SelectChatModel = 'Select chat model',
  // ClearApiKeys = 'Clear API keys', //TODO: implement
}

function getConfigValueBySettingItem(item: SETTINGS_ITEM) {
  switch (item) {
    case SETTINGS_ITEM.MockPaidRequests:
      return getUserConfigValue('mockPaidRequests')
    case SETTINGS_ITEM.SelectChatModel:
      return getUserConfigValue('selectedChatModel')
  }
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
    terminal.singleColumnMenu(
      [
        ...items.map(
          (item) => `${item}: (${getConfigValueBySettingItem(item)})`,
        ),
        'Return to menu',
      ],
      {
        exitOnUnexpectedKey: true,
        selectedStyle: terminal.brightCyan.bold.inverse,
        selectedIndex: items.length,
        continueOnSubmit: false,
        cancelable: true,
      },
      (error, response) => {
        if (this.aborted) {
          this.onReturnToMenu()
        }

        if (error) {
          this.handleError(error)
          return
        }

        if (
          typeof response.selectedIndex !== 'number' ||
          response.selectedIndex === items.length
        ) {
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

    const mock = await selectYesOrNo(
      'Do you want to mock paid requests to AI provider?',
    )
    if (this.aborted) {
      return
    }
    setUserConfigValue('mockPaidRequests', mock)
    this.showSettings()
  }

  private async selectChatModel() {
    terminal.clear()

    const models = (await this.ai.getAvailableModels()).sort()
    terminal.moveTo(1, terminal.height - 2 - models.length)

    const currentModel = getUserConfigValue('selectedChatModel')
    terminal('Current chat model: ').brightCyan.bold(currentModel + '\n')
    const selectedModel = await selectOption(
      models,
      'Select chat model:',
      'vertical',
      currentModel ? models.indexOf(currentModel) : undefined,
    )
    if (this.aborted) {
      return
    }
    setUserConfigValue('selectedChatModel', selectedModel)
    this.showSettings()
  }
}
