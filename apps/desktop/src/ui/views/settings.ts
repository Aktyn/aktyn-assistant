import { Notifications } from '../components/common/notifications'
import { Select } from '../components/common/select'
import { Switch } from '../components/common/switch'
import { createElement } from '../utils/dom'

import { ViewBase } from './viewBase'

export class SettingsView extends ViewBase {
  private launchOnStartupSwitch = new Switch(
    false,
    this.toggleLaunchOnStartup.bind(this),
  )
  private chatModelSelect: Select | null = null
  private mockPaidRequestsSwitch = new Switch(false, (on) =>
    window.electronAPI.setUserConfigValue('mockPaidRequests', on),
  )
  private launchHiddenSwitch = new Switch(false, (on) =>
    window.electronAPI.setUserConfigValue('launchHidden', on),
  )
  private useHistorySwitch = new Switch(false, (on) =>
    window.electronAPI.setUserConfigValue('includeHistory', on),
  )
  private maxHistoryLengthInput = createElement('input', {
    postProcess: (input) => {
      input.type = 'number'
      input.min = '1'
      input.max = '32'
      input.onchange = () => {
        const value = parseInt(input.value)
        if (isNaN(value)) {
          return
        } else {
          window.electronAPI.setUserConfigValue('maxChatHistoryLength', value)
        }
      }
    },
  })

  constructor() {
    super(
      createElement('div', {
        className: 'settings-view content-container',
      }),
    )

    this.init().catch(console.error)
  }

  private async init() {
    const models = await window.electronAPI.getAvailableModels()
    let chatModel =
      await window.electronAPI.getUserConfigValue('selectedChatModel')

    if (!models.length) {
      throw new Error('No AI models available')
    }

    //TODO: prompt user to select model and mock paid requests if not set
    const mockPaidRequests =
      await window.electronAPI.getUserConfigValue('mockPaidRequests')
    if (mockPaidRequests === null) {
      console.warn('Mock paid requests is not set')
      window.electronAPI.setUserConfigValue(
        'mockPaidRequests',
        mockPaidRequests,
      )
    }
    if (chatModel === null) {
      console.warn('Chat model is not set')
      window.electronAPI.setUserConfigValue(
        'selectedChatModel',
        (chatModel = models[0]),
      )
    }

    this.chatModelSelect = new Select(models, chatModel, (model) =>
      window.electronAPI.setUserConfigValue('selectedChatModel', model),
    )

    await this.syncSettings()

    for (const child of [
      createElement('div', {
        content: [
          createElement('div', { content: 'AI provider' }),
          createElement('b', { content: 'OpenAI' }),
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Chat model' }),
          this.chatModelSelect.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Mock paid requests' }),
          this.mockPaidRequestsSwitch.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Launch on startup' }),
          this.launchOnStartupSwitch.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Launch hidden' }),
          this.launchHiddenSwitch.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Include history' }),
          this.useHistorySwitch.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Previous messages sent to AI' }),
          this.maxHistoryLengthInput,
        ],
      }),
    ]) {
      this.content.appendChild(child)
    }
  }

  private async syncSettings() {
    const model =
      await window.electronAPI.getUserConfigValue('selectedChatModel')
    if (model) {
      this.chatModelSelect?.set(model, true)
    }
    this.mockPaidRequestsSwitch.set(
      !!(await window.electronAPI.getUserConfigValue('mockPaidRequests')),
      true,
    )
    this.launchOnStartupSwitch.set(
      await window.electronAPI.getUserConfigValue('autoLaunch'),
      true,
    )
    this.launchHiddenSwitch.set(
      await window.electronAPI.getUserConfigValue('launchHidden'),
      true,
    )
    this.useHistorySwitch.set(
      await window.electronAPI.getUserConfigValue('includeHistory'),
      true,
    )
    this.maxHistoryLengthInput.value = String(
      await window.electronAPI.getUserConfigValue('maxChatHistoryLength'),
    )
  }

  onOpen() {
    super.onOpen()
    this.syncSettings().catch(console.error)
  }

  private async toggleLaunchOnStartup(on: boolean) {
    try {
      const success = await window.electronAPI.setAutoLaunch(on)
      if (!success) {
        this.launchOnStartupSwitch.set(!on, true)
        Notifications.provider.showNotification(Notifications.type.Error, {
          message: 'Failed to set auto launch',
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  public onExternalData(data: { autoLaunchEnabled: boolean }) {
    this.launchOnStartupSwitch.set(data.autoLaunchEnabled, true)
  }
}
