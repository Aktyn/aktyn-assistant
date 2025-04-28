import {
  loadToolsInfo,
  logger,
  setEnabledTools,
  type ToolInfo,
} from '@aktyn-assistant/core'
import { terminal } from 'terminal-kit'

import { selectOption } from '../select'

import { clearTerminal } from './common'
import { View } from './view'

enum ToolAction {
  ToggleEnabled = 'Toggle enabled',
  Return = 'Return',
}

export class ToolsView extends View {
  private aborted = false

  abortAsynchronousActions() {
    this.aborted = true
  }
  open() {
    clearTerminal()

    terminal.moveTo(1, terminal.height - 1)
    terminal.bold('Which tool do you want to edit?')

    const tools = loadToolsInfo()

    terminal.singleColumnMenu(
      [
        ...tools.map(
          (tool) =>
            `${tool.schema.functionName} (${tool.enabled ? 'enabled' : 'disabled'})`,
        ),
        'Return to menu',
      ],
      {
        exitOnUnexpectedKey: true,
        selectedStyle: terminal.brightCyan.bold.inverse,
        selectedIndex: tools.length,
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
          response.selectedIndex === tools.length
        ) {
          this.onReturnToMenu()
        } else {
          this.editTool(tools[response.selectedIndex], tools).catch(
            this.handleError,
          )
        }
      },
    )
  }

  private async editTool(toolToEdit: ToolInfo, tools: ToolInfo[]) {
    clearTerminal()
    terminal.moveTo(1, terminal.height - 1)

    terminal
      .bold(toolToEdit.schema.functionName)
      .noFormat()
      .defaultColor(` (v${toolToEdit.schema.version})`)
    terminal.eraseLineAfter('\n')
    terminal.defaultColor(toolToEdit.schema.description)
    terminal.eraseLineAfter('\n')
    terminal
      .bold('Enabled: ')
      .noFormat()
      .defaultColor(String(toolToEdit.enabled))
    terminal.eraseLineAfter('\n')
    terminal
      .bold('Built-in: ')
      .noFormat()
      .defaultColor(String(toolToEdit.builtIn))
    terminal.eraseLineAfter('\n')
    terminal.eraseLineAfter('\n')

    const items = Object.values(ToolAction)
    const action = await selectOption(
      items,
      'Select action:',
      'vertical',
      items.length - 1,
    )
    if (this.aborted) {
      return
    }

    switch (action) {
      case ToolAction.ToggleEnabled:
        {
          const enabledTools = tools.reduce((acc, tool) => {
            if (tool.schema.functionName === toolToEdit.schema.functionName) {
              if (!tool.enabled) {
                acc.push(tool.schema.functionName)
              }
            } else if (tool.enabled) {
              acc.push(tool.schema.functionName)
            }
            return acc
          }, [] as string[])
          logger.info(`Toggle enabled: ${enabledTools}`)
          setEnabledTools(enabledTools)
        }
        break
      case ToolAction.Return:
        break
    }

    this.open()
  }
}
