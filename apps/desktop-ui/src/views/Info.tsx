import { Fragment, useContext, useEffect, useMemo, useRef } from 'react'
import { CardBody, CardHeader } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import anime from 'animejs'
import { GlassCard } from '../components/common/GlassCard'
import { GlobalContext } from '../context/GlobalContextProvider'

export const Info = ({ in: active }: { in?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { initData } = useContext(GlobalContext)

  const versions = useMemo(getVersions, [])

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
    <div
      ref={ref}
      className="flex flex-col items-stretch justify-center gap-4 py-4 my-auto"
    >
      <GlassCard className="overflow-visible">
        <CardHeader className="text-xl font-bold justify-center">
          Author
        </CardHeader>
        <CardBody className="justify-start">
          <div>
            <span>Created by </span>
            <b>Aktyn</b>
          </div>
          <Link
            href="https://github.com/Aktyn"
            color="foreground"
            isBlock
            isExternal
            showAnchorIcon
            underline="hover"
            rel="noreferrer"
          >
            Author repository
          </Link>
          <Link
            href="https://github.com/Aktyn/aktyn-assistant"
            color="foreground"
            isBlock
            isExternal
            showAnchorIcon
            underline="hover"
            rel="noreferrer"
          >
            Project repository
          </Link>
        </CardBody>
      </GlassCard>
      <GlassCard className="overflow-visible">
        <CardHeader className="text-xl font-bold justify-center">
          Versions
        </CardHeader>
        <CardBody className="justify-start">
          <div className="versions values-list">
            <span>Aktyn Assistant:</span>
            <b>{initData?.version ?? '-'}</b>
          </div>
          <div className="versions values-list">
            {Object.entries(versions).map(([name, version], index) => (
              <Fragment key={index}>
                <span className="capitalize">{name}:</span>
                <b>{version}</b>
              </Fragment>
            ))}
          </div>
        </CardBody>
      </GlassCard>
    </div>
  )
}

function getVersions(): Record<'node' | 'chrome' | 'electron', string> {
  try {
    return JSON.parse(document.body.getAttribute('versions') ?? '{}')
  } catch {
    return {} as never
  }
}
