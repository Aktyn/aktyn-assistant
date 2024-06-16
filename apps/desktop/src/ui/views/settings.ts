import { Select } from '../components/select'
import { Switch } from '../components/switch'
import { createElement } from '../domUtils'

import { ViewBase } from './viewBase'

export class SettingsView extends ViewBase {
  constructor() {
    super(
      createElement('div', {
        className: 'settings-view content-container',
      }),
    )

    this.init().catch(console.error)
  }

  private async init() {
    const mockPaidRequests = await window.electronAPI.getUserConfigValue('mockPaidRequests')
    const models = await window.electronAPI.getAvailableModels()
    const chatModel = await window.electronAPI.getUserConfigValue('selectedChatModel')

    if (mockPaidRequests === null) {
      throw new Error('Mock paid requests is not set')
    }
    if (chatModel === null) {
      throw new Error('Chat model is not set')
    }

    const mockPaidRequestsSwitch = new Switch(mockPaidRequests, (on) =>
      window.electronAPI.setUserConfigValue('mockPaidRequests', on),
    )
    const chatModelSelect = new Select(models, chatModel, (model) =>
      window.electronAPI.setUserConfigValue('selectedChatModel', model),
    )

    for (const child of [
      createElement('div', {
        content: [
          createElement('div', { content: 'AI provider' }),
          createElement('b', { content: 'OpenAI' }),
        ],
      }),

      createElement('div', {
        content: [createElement('div', { content: 'Chat model' }), chatModelSelect.element],
      }),

      createElement('div', {
        content: [
          createElement('div', { content: 'Mock paid requests' }),
          mockPaidRequestsSwitch.element,
        ],
      }),
    ]) {
      this.content.appendChild(child)
    }
  }
}
