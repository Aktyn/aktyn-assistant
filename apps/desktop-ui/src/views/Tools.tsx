import { useCallback, useEffect, useRef, useState } from 'react'
import { PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader } from '@/components/ui/card'
import { GlassCard } from '../components/common/GlassCard'
import { AddToolDialog } from '../components/tools/AddToolDialog'
import { ToolsList } from '../components/tools/ToolsList'
import { useCancellablePromise } from '../hooks/useCancellablePromise'

type ToolInfo = Awaited<
  ReturnType<typeof window.electronAPI.loadToolsInfo>
>[number]

export const Tools = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const cancellable = useCancellablePromise()

  const [addToolDialogOpen, setAddToolDialogOpen] = useState(false)
  const [availableTools, setAvailableTools] = useState<Array<ToolInfo>>([])

  const loadTools = useCallback(() => {
    cancellable(window.electronAPI.loadToolsInfo())
      .then(setAvailableTools)
      .catch(console.error)
  }, [cancellable])

  useEffect(() => {
    if (active) {
      loadTools()
    }
  }, [active, loadTools])

  //TODO: Add animation
  // useEffect(() => {
  //   const container = ref.current
  //   if (!container) {
  //     return
  //   }

  //   const animation = animate(container.querySelectorAll(':scope > *'), {
  //     easing: 'spring(1, 80, 10, 0)',
  //     scale: active ? 1 : 0.618,
  //     rotate: active ? 0 : stagger(['15deg', '-15deg']),
  //     delay: stagger(200, { from: 'first' }),
  //   })

  //   return () => {
  //     animation.cancel()
  //   }
  // }, [active])

  return (
    <>
      <div
        ref={ref}
        className="flex flex-col items-center justify-center gap-4 py-4 my-auto"
      >
        <Button
          className="font-semibold backdrop-blur-sm shadow-[0_0_8rem] shadow-primary-400/40 border-1 border-primary-500/50 hover:border-primary-200"
          size="lg"
          variant="secondary"
          onClick={() => setAddToolDialogOpen(true)}
        >
          <PlusSquare size={32} className="mr-2" />
          Add tool
        </Button>
        {availableTools.length > 0 && (
          <GlassCard>
            <CardHeader className="text-xl font-bold justify-center">
              Available tools
            </CardHeader>
            <CardContent>
              <ToolsList tools={availableTools} onRequestReload={loadTools} />
            </CardContent>
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
