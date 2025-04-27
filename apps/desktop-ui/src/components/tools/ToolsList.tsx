import { useCallback, useState } from 'react'
import type { ImportedToolInfo, ToolInfo } from '@aktyn-assistant/core'
import { mdiCog, mdiDelete } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { Checkbox, CheckboxGroup } from '@nextui-org/checkbox'
import { Chip } from '@nextui-org/chip'
import { Tooltip } from '@nextui-org/tooltip'
import { useCancellablePromise } from '../../hooks/useCancellablePromise'
import { ToolEditDialog } from '../dialog/ToolEditDialog'

type ToolsListProps = {
  tools: ToolInfo[]
  onRequestReload: () => void
}

export const ToolsList = ({ tools, onRequestReload }: ToolsListProps) => {
  const cancellable = useCancellablePromise()

  const enabledToolsCount = tools.filter((tool) => tool.enabled).length

  const [toolToEdit, setToolToEdit] = useState<ToolInfo | null>(null)
  const [openToolEditDialog, setOpenToolEditDialog] = useState(false)

  const handleEnabledToolsChange = useCallback(
    (toolNames: string[]) => {
      cancellable(window.electronAPI.setEnabledTools(toolNames))
        .then(onRequestReload)
        .catch(console.error)
    },
    [cancellable, onRequestReload],
  )

  const removeTool = useCallback(
    (tool: ImportedToolInfo) => {
      cancellable(window.electronAPI.removeTool(tool.schema.functionName))
        .then(onRequestReload)
        .catch(console.error)
    },
    [cancellable, onRequestReload],
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <Checkbox
          size="lg"
          radius="sm"
          className="gap-x-2"
          isIndeterminate={
            enabledToolsCount > 0 && enabledToolsCount < tools.length
          }
          isSelected={enabledToolsCount === tools.length}
          onValueChange={(selected) => {
            if (selected) {
              handleEnabledToolsChange(
                tools.map((tool) => tool.schema.functionName),
              )
            } else {
              handleEnabledToolsChange([])
            }
          }}
        >
          Enable all
        </Checkbox>
        <CheckboxGroup
          size="lg"
          radius="sm"
          value={tools.reduce((acc, tool) => {
            if (tool.enabled) {
              acc.push(tool.schema.functionName)
            }
            return acc
          }, [] as string[])}
          onValueChange={handleEnabledToolsChange}
        >
          {tools.map((tool) => (
            <div
              key={tool.schema.functionName}
              className="flex flex-row items-center justify-between gap-x-2"
            >
              <Checkbox value={tool.schema.functionName} className="gap-x-2">
                <div className="flex flex-col items-start max-w-96">
                  <div className="flex flex-row items-baseline">
                    <strong>{tool.schema.functionName}</strong>
                    <Chip
                      size="sm"
                      radius="full"
                      variant="light"
                      className="text-foreground-400"
                    >
                      ({tool.schema.version})
                    </Chip>
                  </div>
                  <span className="text-sm text-foreground-500 text-balance">
                    {tool.schema.description}
                  </span>
                </div>
              </Checkbox>
              <Tooltip content="Edit tool">
                <Button
                  isIconOnly
                  size="md"
                  variant="light"
                  radius="full"
                  onClick={(event) => {
                    setToolToEdit(tool)
                    setOpenToolEditDialog(true)
                    event.stopPropagation()
                  }}
                >
                  <Icon
                    className="transition-transform"
                    path={mdiCog}
                    rotate={openToolEditDialog && toolToEdit === tool ? 90 : 0}
                    size="1.5rem"
                  />
                </Button>
              </Tooltip>
              {tool.builtIn ? (
                <Chip size="sm" radius="full" variant="flat" color="secondary">
                  Built-in
                </Chip>
              ) : (
                <Tooltip content="Remove tool">
                  <Button
                    isIconOnly
                    size="md"
                    variant="light"
                    radius="full"
                    onClick={() => removeTool(tool)}
                  >
                    <Icon path={mdiDelete} size="1.5rem" />
                  </Button>
                </Tooltip>
              )}
            </div>
          ))}
        </CheckboxGroup>
      </div>
      {toolToEdit && (
        <ToolEditDialog
          tool={toolToEdit}
          open={openToolEditDialog}
          onClose={(edited) => {
            setToolToEdit(null)
            if (edited) {
              onRequestReload()
            }
          }}
        />
      )}
    </>
  )
}
