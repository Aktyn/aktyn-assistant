import { useCallback } from 'react'
import type { AvailableToolsInfo } from '@aktyn-assistant/core'
import { mdiDelete } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { Checkbox, CheckboxGroup } from '@nextui-org/checkbox'
import { Tooltip } from '@nextui-org/tooltip'
import { useCancellablePromise } from '../../hooks/useCancellablePromise'

type ToolsListProps = {
  tools: AvailableToolsInfo[]
  onRequestReload: () => void
}

export const ToolsList = ({ tools, onRequestReload }: ToolsListProps) => {
  const cancellable = useCancellablePromise()

  const enabledToolsCount = tools.filter((tool) => tool.enabled).length

  const handleEnabledToolsChange = useCallback(
    (toolNames: string[]) => {
      cancellable(window.electronAPI.setEnabledTools(toolNames))
        .then(onRequestReload)
        .catch(console.error)
    },
    [cancellable, onRequestReload],
  )

  const removeTool = useCallback(
    (toolName: string) => {
      cancellable(window.electronAPI.removeTool(toolName))
        .then(onRequestReload)
        .catch(console.error)
    },
    [cancellable, onRequestReload],
  )

  return (
    <div className="flex flex-col gap-y-2">
      <Checkbox
        isIndeterminate={
          enabledToolsCount > 0 && enabledToolsCount < tools.length
        }
        isSelected={enabledToolsCount === tools.length}
        onValueChange={(selected) => {
          if (selected) {
            handleEnabledToolsChange(tools.map((tool) => tool.functionName))
          } else {
            handleEnabledToolsChange([])
          }
        }}
      >
        Enable all
      </Checkbox>
      <CheckboxGroup
        value={tools.reduce((acc, tool) => {
          if (tool.enabled) {
            acc.push(tool.functionName)
          }
          return acc
        }, [] as string[])}
        onValueChange={handleEnabledToolsChange}
      >
        {tools.map((tool) => (
          <div
            key={`${tool.functionName}-${tool.directoryName}`}
            className="flex flex-row items-center justify-between gap-x-2"
          >
            <Checkbox value={tool.functionName}>
              <div className="flex flex-col items-start max-w-96">
                <strong>{tool.functionName}</strong>
                <span className="text-sm text-foreground-500 text-balance">
                  {tool.description}
                </span>
              </div>
            </Checkbox>
            <Tooltip content="Remove tool">
              <Button
                isIconOnly
                size="md"
                variant="light"
                radius="full"
                onClick={() => removeTool(tool.functionName)}
              >
                <Icon path={mdiDelete} size="1.5rem" />
              </Button>
            </Tooltip>
          </div>
        ))}
      </CheckboxGroup>
    </div>
  )
}
