import { useCallback, useState } from 'react'
import type { ImportedToolInfo, ToolInfo } from '@aktyn-assistant/core'
import { Settings, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCancellablePromise } from '../../hooks/useCancellablePromise'
import { ToolEditDialog } from '../dialog/ToolEditDialog'
import { cn } from '@/lib/utils'
import { Label } from '../ui/label'

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
        <div className="flex items-center mb-2">
          <Checkbox
            id="enable-all-tools"
            checked={
              enabledToolsCount > 0 && enabledToolsCount === tools.length
                ? true
                : enabledToolsCount > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(checked: boolean | 'indeterminate') => {
              const selected = checked === true // indeterminate also triggers change
              if (selected) {
                handleEnabledToolsChange(
                  tools.map((tool) => tool.schema.functionName),
                )
              } else {
                handleEnabledToolsChange([])
              }
            }}
            className="size-6 **:[svg]:size-5"
          />
          <Label htmlFor="enable-all-tools" className="text-lg">
            Enable all
          </Label>
        </div>
        <div className="flex flex-col gap-y-2">
          {tools.map((tool) => (
            <div
              key={tool.schema.functionName}
              className="flex flex-row items-center justify-between gap-x-2"
            >
              <div className="flex flex-row items-center gap-x-2">
                <Checkbox
                  id={`tool-${tool.schema.functionName}`}
                  checked={tool.enabled}
                  onCheckedChange={(checked: boolean) => {
                    const currentEnabled = tools
                      .filter((t) => t.enabled)
                      .map((t) => t.schema.functionName)
                    const toolName = tool.schema.functionName
                    if (checked) {
                      handleEnabledToolsChange([...currentEnabled, toolName])
                    } else {
                      handleEnabledToolsChange(
                        currentEnabled.filter((name) => name !== toolName),
                      )
                    }
                  }}
                  className="gap-x-2 size-6 **:[svg]:size-5"
                />
                <div className="flex flex-col items-start max-w-96">
                  <div className="flex flex-row items-baseline">
                    <Label
                      htmlFor={`tool-${tool.schema.functionName}`}
                      className="font-bold"
                    >
                      {tool.schema.functionName}
                    </Label>
                    <Badge
                      variant="outline"
                      className="ml-1 text-muted-foreground"
                    >
                      v{tool.schema.version}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground text-pretty">
                    {tool.schema.description}
                  </span>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full ml-auto"
                      onClick={(event) => {
                        event.stopPropagation()
                        setToolToEdit(tool)
                        setOpenToolEditDialog(true)
                      }}
                    >
                      <Settings
                        className={cn(
                          'transition-transform',
                          openToolEditDialog &&
                            toolToEdit === tool &&
                            'rotate-90',
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit tool</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {tool.builtIn ? (
                <Badge variant="secondary">Built-in</Badge>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-destructive"
                        onClick={() => removeTool(tool)}
                      >
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove tool</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ))}
        </div>
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
