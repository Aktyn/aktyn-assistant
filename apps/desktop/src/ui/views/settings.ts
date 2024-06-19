import { Notifications } from '../components/notifications'
import { Select } from '../components/select'
import { Switch } from '../components/switch'
import { createElement } from '../utils/dom'

import { ViewBase } from './viewBase'

export class SettingsView extends ViewBase {
  private launchOnStartupSwitch = new Switch(
    false,
    this.toggleLaunchOnStartup.bind(this),
  )

  constructor() {
    super(
      createElement('div', {
        className: 'settings-view content-container',
      }),
    )

    this.init().catch(console.error)
  }

  private async init() {
    let mockPaidRequests =
      await window.electronAPI.getUserConfigValue('mockPaidRequests')
    const models = await window.electronAPI.getAvailableModels()
    let chatModel =
      await window.electronAPI.getUserConfigValue('selectedChatModel')

    if (!models.length) {
      throw new Error('No AI models available')
    }

    //TODO: prompt user to select model and mock paid requests if not set
    if (mockPaidRequests === null) {
      console.warn('Mock paid requests is not set')
      window.electronAPI.setUserConfigValue(
        'mockPaidRequests',
        (mockPaidRequests = false),
      )
    }
    if (chatModel === null) {
      console.warn('Chat model is not set')
      window.electronAPI.setUserConfigValue(
        'selectedChatModel',
        (chatModel = models[0]),
      )
    }

    const chatModelSelect = new Select(models, chatModel, (model) =>
      window.electronAPI.setUserConfigValue('selectedChatModel', model),
    )
    const mockPaidRequestsSwitch = new Switch(mockPaidRequests, (on) =>
      window.electronAPI.setUserConfigValue('mockPaidRequests', on),
    )

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
          chatModelSelect.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Mock paid requests' }),
          mockPaidRequestsSwitch.element,
        ],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Launch on startup' }),
          this.launchOnStartupSwitch.element,
        ],
      }),
    ]) {
      this.content.appendChild(child)
    }
  }

  public onOpen() {}

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
