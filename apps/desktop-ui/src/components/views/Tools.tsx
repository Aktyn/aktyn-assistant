import { GlassCard } from '@/components/common/GlassCard'
import { AddToolDialog } from '@/components/tools/AddToolDialog'
import { ToolsList } from '@/components/tools/ToolsList'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader } from '@/components/ui/card'
import { useCancellablePromise } from '@/hooks/useCancellablePromise'
import { PlusSquare } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type ToolInfo = Awaited<
  ReturnType<typeof window.electronAPI.loadToolsInfo>
>[number]

export const Tools = ({ in: active }: { in?: boolean }) => {
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

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4 py-4 my-auto">
        <Button
          className="font-semibold backdrop-blur-sm shadow-[0_0_8rem] shadow-primary/40 border border-primary/50 hover:border-primary"
          size="lg"
          variant="default"
          onClick={() => setAddToolDialogOpen(true)}
        >
          <PlusSquare />
          Add tool
        </Button>
        {availableTools.length > 0 && (
          <GlassCard>
            <CardHeader className="text-xl font-bold justify-center text-center">
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
