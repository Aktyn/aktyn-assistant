import fs from 'fs'
import path from 'path'

import { logger } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { selectOption } from '../select'

import { clearTerminal } from './common'
import { View } from './view'

const authorSite = 'https://aktyn.github.io/'
const projectRepo = 'https://github.com/Aktyn/aktyn-assistant'

export class InfoView extends View {
  private aborted = false

  abortAsynchronousActions() {
    this.aborted = true
  }

  open() {
    clearTerminal()

    terminal.moveTo(1, terminal.height - 1)

    const info = [
      { label: 'Author', value: 'Radosław Krajewski (Aktyn)' },
      { label: 'Author website', value: authorSite },
      {
        label: 'Project repo',
        value: projectRepo,
      },
      { label: 'Version', value: getVersion() ?? '-' },
    ]

    for (const { label, value } of info) {
      terminal.bold(`${label}: `).noFormat().defaultColor(value)
      terminal.eraseLineAfter('\n')
    }

    const options = [
      'Open author website',
      'Open project repo',
      'Return to menu',
    ]
    terminal.eraseLineAfter('\n')
    selectOption(options, 'Select action:', 'vertical', 2)
      .then((choice) => {
        if (this.aborted) {
          return
        }
        const choiceIndex = options.indexOf(choice)
        switch (choiceIndex) {
          case 0:
            import('open')
              .then(({ default: open }) => open(authorSite))
              .catch(logger.error)
            this.open()
            break
          case 1:
            import('open')
              .then(({ default: open }) => open(projectRepo))
              .catch(logger.error)
            this.open()
            break
          case 2:
            this.onReturnToMenu()
            break
        }
      })
      .catch(this.handleError)
  }
}

function getVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return packageJson.version
    }
  } catch (error) {
    logger.error(error)
    return null
  }
}
