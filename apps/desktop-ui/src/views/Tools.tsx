import { useCallback, useEffect, useRef, useState } from 'react'
import { mdiDelete, mdiPlusBox } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { CardBody, CardHeader } from '@nextui-org/card'
import { Checkbox, CheckboxGroup } from '@nextui-org/checkbox'
import { Tooltip } from '@nextui-org/tooltip'
import anime from 'animejs'
import { GlassCard } from '../components/common/GlassCard'
import { AddToolDialog } from '../components/tools/AddToolDialog'
import { useCancellablePromise } from '../hooks/useCancellablePromise'

type AvailableToolsInfo = Awaited<
  ReturnType<typeof window.electronAPI.loadAvailableToolsInfo>
>[number]

export const Tools = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const cancellable = useCancellablePromise()

  const [addToolDialogOpen, setAddToolDialogOpen] = useState(false)
  const [availableTools, setAvailableTools] = useState<
    Array<AvailableToolsInfo>
  >([])

  const enabledToolsCount = availableTools.filter((tool) => tool.enabled).length

  const loadTools = useCallback(() => {
    cancellable(window.electronAPI.loadAvailableToolsInfo())
      .then(setAvailableTools)
      .catch(console.error)
  }, [cancellable])

  useEffect(() => {
    if (active) {
      loadTools()
    }
  }, [active, loadTools])

  const handleEnabledToolsChange = useCallback(
    (toolNames: string[]) => {
      cancellable(window.electronAPI.setEnabledTools(toolNames))
        .then(loadTools)
        .catch(console.error)
    },
    [cancellable, loadTools],
  )

  const removeTool = useCallback(
    (toolName: string) => {
      cancellable(window.electronAPI.removeTool(toolName))
        .then(loadTools)
        .catch(console.error)
    },
    [cancellable, loadTools],
  )

  useEffect(() => {
    const container = ref.current
    if (!container) {
      return
    }

    const animation = anime({
      targets: container.querySelectorAll(':scope > *'),
      easing: 'spring(1, 80, 10, 0)',
      scale: active ? 1 : 0.618,
      rotate: active ? 0 : anime.stagger(['15deg', '-15deg']),
      delay: anime.stagger(200, { from: 'first' }),
    })

    return () => {
      anime.remove(animation)
    }
  }, [active])

  return (
    <>
      <div
        ref={ref}
        className="flex flex-col items-center justify-center gap-4 py-4 my-auto"
      >
        <Button
          className="font-semibold backdrop-blur-sm shadow-[0_0_8rem] shadow-primary-400/40 border-1 border-primary-500/50 hover:border-primary-200"
          size="lg"
          color="primary"
          variant="flat"
          startContent={<Icon path={mdiPlusBox} size="2rem" />}
          onClick={() => setAddToolDialogOpen(true)}
        >
          Add tool
        </Button>
        {availableTools.length > 0 && (
          <GlassCard>
            <CardHeader className="text-xl font-bold justify-center">
              Available tools
            </CardHeader>
            <CardBody className="gap-y-2">
              <Checkbox
                isIndeterminate={
                  enabledToolsCount > 0 &&
                  enabledToolsCount < availableTools.length
                }
                isSelected={enabledToolsCount === availableTools.length}
                onValueChange={(selected) => {
                  if (selected) {
                    handleEnabledToolsChange(
                      availableTools.map((tool) => tool.functionName),
                    )
                  } else {
                    handleEnabledToolsChange([])
                  }
                }}
              >
                Enable all
              </Checkbox>
              <CheckboxGroup
                value={availableTools.reduce((acc, tool) => {
                  if (tool.enabled) {
                    acc.push(tool.functionName)
                  }
                  return acc
                }, [] as string[])}
                onValueChange={handleEnabledToolsChange}
              >
                {availableTools.map((tool) => (
                  <div
                    key={`${tool.functionName}-${tool.directoryName}`}
                    className="flex flex-row gap-x-4"
                  >
                    <Checkbox value={tool.functionName}>
                      <div className="flex flex-col items-start">
                        <strong>{tool.functionName}</strong>
                        <span className="text-sm text-foreground-500">
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
            </CardBody>
          </GlassCard>
        )}
      </div>
      <AddToolDialog
        open={addToolDialogOpen}
        onClose={(success) => {
          if (success) {
            loadTools()
          }
          setAddToolDialogOpen(false)
        }}
      />
    </>
  )
}
