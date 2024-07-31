import fs from 'fs'
import path from 'path'

import { logger } from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { clearTerminal, showEscapeToReturnToMenuInfo } from './common'
import { View } from './view'

export class InfoView extends View {
  abortAsynchronousActions() {}
  open() {
    clearTerminal()

    terminal.moveTo(1, terminal.height - 1)

    const info = [
      { label: 'Author', value: 'Radosław Krajewski (Aktyn)' },
      { label: 'Author website', value: 'https://aktyn.github.io/' },
      {
        label: 'Project repo',
        value: 'https://github.com/Aktyn/aktyn-assistant',
      },
      { label: 'Version', value: getVersion() ?? '-' },
    ]

    for (const { label, value } of info) {
      terminal.bold(`${label}: `).noFormat().defaultColor(value)
      terminal.eraseLineAfter('\n')
    }

    showEscapeToReturnToMenuInfo()
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
