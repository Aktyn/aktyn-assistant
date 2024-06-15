import { createElement, createMdiIcon } from '../domUtils'

import { ViewBase } from './viewBase'

export class InfoView extends ViewBase {
  constructor() {
    const versions = getVersions()
    super(
      createElement('div', {
        className: 'info-view content-container',
        content: [
          createElement('div', {
            content: [
              createElement('div', {
                content: [
                  createElement('span', { content: 'Created by ' }),
                  createElement('b', { content: 'Aktyn' }),
                ],
              }),
            ],
            style: { textAlign: 'center' },
          }),
          createElement('a', {
            content: [
              createElement('span', { content: 'Author repository ' }),
              createMdiIcon('open-in-new'),
            ],
            style: { display: 'block', textAlign: 'center' },
            postProcess: (a) => {
              a.target = '_blank'
              a.href = 'https://github.com/Aktyn'
            },
          }),
          createElement('a', {
            content: [
              createElement('span', { content: 'Project repository ' }),
              createMdiIcon('open-in-new'),
            ],
            style: { display: 'block', textAlign: 'center' },
            postProcess: (a) => {
              a.target = '_blank'
              a.href = 'https://github.com/Aktyn/aktyn-assistant'
            },
          }),
          createElement('hr'),
          createElement('div', {
            className: 'versions values-list',
            content: Object.entries(versions).flatMap(([name, version]) => [
              createElement('span', { content: `${name} version:` }),
              createElement('b', { content: version }),
            ]),
          }),
        ],
      }),
    )
  }
}

function getVersions(): Record<'node' | 'chrome' | 'electron', string> {
  try {
    return JSON.parse(document.body.getAttribute('versions') ?? '{}')
  } catch {
    return {} as never
  }
}
