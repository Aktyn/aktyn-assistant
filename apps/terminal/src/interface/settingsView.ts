import { gttsLanguages, trimString } from '@aktyn-assistant/common'
import { getUserConfigValue, setUserConfigValue } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { printError } from '../error'
import { inputNumber, inputText } from '../input'
import { selectOption, selectYesOrNo } from '../select'

import { clear } from './common'
import { View } from './view'

enum SETTINGS_ITEM {
  MockPaidRequests = 'Mock paid requests',
  SelectChatModel = 'Select chat model',
  IncludeHistory = 'Include history',
  PreviousMessagesSentToAI = 'Previous messages sent to AI',
  InitialSystemMessage = 'Initial system message',
  ReadChatResponses = 'Read chat responses',
  TextToSpeechLanguage = 'Text to speech language',
}

function getConfigValueBySettingItem(item: SETTINGS_ITEM) {
  switch (item) {
    case SETTINGS_ITEM.MockPaidRequests:
      return getUserConfigValue('mockPaidRequests')
    case SETTINGS_ITEM.SelectChatModel:
      return getUserConfigValue('selectedChatModel')
    case SETTINGS_ITEM.IncludeHistory:
      return getUserConfigValue('includeHistory')
    case SETTINGS_ITEM.PreviousMessagesSentToAI:
      return getUserConfigValue('maxChatHistoryLength')
    case SETTINGS_ITEM.InitialSystemMessage:
      return getUserConfigValue('initialSystemMessage')
    case SETTINGS_ITEM.ReadChatResponses:
      return getUserConfigValue('readChatResponses')
    case SETTINGS_ITEM.TextToSpeechLanguage: {
      const key = getUserConfigValue('textToSpeechLanguage')
      return gttsLanguages[key as keyof typeof gttsLanguages] ?? key
    }
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
    clear()

    terminal.moveTo(1, terminal.height - 1)
    terminal.bold('Which settings do you want to change?')

    const items = Object.values(SETTINGS_ITEM)
    terminal.singleColumnMenu(
      [
        ...items.map((item) => {
          let currentValue = getConfigValueBySettingItem(item)
          if (currentValue === null) {
            return `${item}: [not set]`
          }
          if (typeof currentValue === 'string') {
            currentValue = trimString(currentValue, 32)
          }
          return `${item}: (${currentValue})`
        }),
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
            case SETTINGS_ITEM.IncludeHistory:
              this.selectIncludeHistory().catch(this.handleError)
              break
            case SETTINGS_ITEM.PreviousMessagesSentToAI:
              this.selectPreviousMessagesSentToAI().catch(this.handleError)
              break
            case SETTINGS_ITEM.InitialSystemMessage:
              this.selectInitialSystemMessage().catch(this.handleError)
              break
            case SETTINGS_ITEM.ReadChatResponses:
              this.selectReadChatResponses().catch(this.handleError)
              break
            case SETTINGS_ITEM.TextToSpeechLanguage:
              this.selectTextToSpeechLanguage().catch(this.handleError)
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

    const models = (await this.ai.getAvailableModels()).chatModels.sort()
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

  private async selectIncludeHistory() {
    clear()
    terminal.moveTo(1, terminal.height - 1)

    const includeHistory = await selectYesOrNo(
      'Do you want to include previous messages sent to AI?',
    )
    if (this.aborted) {
      return
    }
    setUserConfigValue('includeHistory', includeHistory)
    this.showSettings()
  }

  private async selectPreviousMessagesSentToAI() {
    clear()
    terminal.moveTo(1, terminal.height - 1)

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const maxChatHistoryLength = await inputNumber(
        'Enter max chat history length',
        1,
        32,
        getUserConfigValue('maxChatHistoryLength')?.toString(),
      )
      if (this.aborted) {
        return
      }

      if (
        typeof maxChatHistoryLength !== 'number' ||
        maxChatHistoryLength < 1
      ) {
        printError({ title: 'Invalid max chat history value' })
        continue
      }

      setUserConfigValue('maxChatHistoryLength', maxChatHistoryLength)
      break
    }

    this.showSettings()
  }

  private async selectInitialSystemMessage() {
    clear()
    terminal.moveTo(1, terminal.height - 1)

    const initialSystemMessage = await inputText(
      'Enter initial system message',
      getUserConfigValue('initialSystemMessage'),
    )
    if (this.aborted) {
      return
    }
    if (initialSystemMessage && initialSystemMessage.length > 1) {
      setUserConfigValue('initialSystemMessage', initialSystemMessage)
    }
    this.showSettings()
  }

  private async selectReadChatResponses() {
    clear()
    terminal.moveTo(1, terminal.height - 1)

    const readChatResponses = await selectYesOrNo(
      'Do you want to read chat responses?',
    )
    if (this.aborted) {
      return
    }
    setUserConfigValue('readChatResponses', readChatResponses)
    this.showSettings()
  }

  private async selectTextToSpeechLanguage() {
    clear()
    terminal.moveTo(1, terminal.height - 1)

    const entries = Object.entries(gttsLanguages)

    const currentIndex = entries.findIndex(
      ([key]) => key === getUserConfigValue('textToSpeechLanguage'),
    )

    const textToSpeechLanguage = await selectOption(
      Object.values(gttsLanguages),
      'Select text to speech language',
      'vertical',
      currentIndex === -1 ? undefined : currentIndex,
    )
    if (this.aborted) {
      return
    }

    const textToSpeechLanguageIndex = entries.findIndex(
      ([, value]) => value === textToSpeechLanguage,
    )

    if (textToSpeechLanguageIndex !== -1) {
      setUserConfigValue(
        'textToSpeechLanguage',
        entries[textToSpeechLanguageIndex][0],
      )
    }
    this.showSettings()
  }
}
