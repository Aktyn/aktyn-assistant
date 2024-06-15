import { Select } from '../components/select'
import { Switch } from '../components/switch'
import { createElement } from '../domUtils'

import { ViewBase } from './viewBase'

export class SettingsView extends ViewBase {
  constructor() {
    const mockPaidRequestsSwitch = new Switch(true, console.log) //TODO
    const chatModelSelect = new Select(
      [
        'mock value 1',
        'mock value 2',
        'mock value 3',
        'mock value 4',
        'mock value 5',
        'mock value 6',
      ],
      'mock value 3',
      console.log,
    ) //TODO

    super(
      createElement('div', {
        className: 'settings-view content-container',
        content: [
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
        ],
      }),
    )
  }
}
