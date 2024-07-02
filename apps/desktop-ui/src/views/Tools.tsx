import { useEffect, useRef, useState } from 'react'
import { mdiPlusBox } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { CardBody, CardHeader } from '@nextui-org/card'
import anime from 'animejs'
import { GlassCard } from '../components/common/GlassCard'
import { AddToolDialog } from '../components/tools/AddToolDialog'

export const Tools = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)

  const [addToolDialogOpen, setAddToolDialogOpen] = useState(false)

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
        className="flex flex-col items-stretch justify-center gap-4 py-4 my-auto"
      >
        <Button
          className="font-semibold backdrop-blur-sm shadow-[0_0_8rem] shadow-primary-400/40"
          size="lg"
          color="primary"
          variant="flat"
          startContent={<Icon path={mdiPlusBox} />}
          onClick={() => setAddToolDialogOpen(true)}
        >
          Add tool
        </Button>
        {/* TODO: show only where there are tools available */}
        <GlassCard>
          <CardHeader className="text-xl font-bold justify-center">
            Available tools
          </CardHeader>
          <CardBody>
            <div className="text-foreground-600 font-bold text-center">
              No tools available
            </div>
          </CardBody>
        </GlassCard>
      </div>
      <AddToolDialog
        open={addToolDialogOpen}
        onClose={() => setAddToolDialogOpen(false)}
      />
    </>
  )
}
