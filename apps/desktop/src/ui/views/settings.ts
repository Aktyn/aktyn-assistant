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
    let mockPaidRequests = await window.electronAPI.getUserConfigValue('mockPaidRequests')
    const models = await window.electronAPI.getAvailableModels()
    let chatModel = await window.electronAPI.getUserConfigValue('selectedChatModel')

    if (!models.length) {
      throw new Error('No AI models available')
    }

    //TODO: prompt user to select model and mock paid requests if not set
    if (mockPaidRequests === null) {
      console.warn('Mock paid requests is not set')
      window.electronAPI.setUserConfigValue('mockPaidRequests', (mockPaidRequests = false))
    }
    if (chatModel === null) {
      console.warn('Chat model is not set')
      window.electronAPI.setUserConfigValue('selectedChatModel', (chatModel = models[0]))
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
