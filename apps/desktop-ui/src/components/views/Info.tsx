import { GlassCard } from '@/components/common/GlassCard'
import { CardContent, CardHeader } from '@/components/ui/card'
import { GlobalContext } from '@/context/GlobalContextProvider'
import { ExternalLink } from 'lucide-react'
import { Fragment, useContext, useMemo } from 'react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'

export const Info = ({ in: _active }: { in?: boolean }) => {
  const { initData } = useContext(GlobalContext)

  const versions = useMemo(() => getVersions(), [])

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-stretch justify-center gap-4 py-4">
        <GlassCard className="overflow-visible">
          <CardHeader className="text-xl font-bold justify-center">
            Author
          </CardHeader>
          <CardContent className="flex flex-col justify-start items-center gap-y-2">
            <Label className="gap-x-1">
              Created by<strong>Aktyn</strong>
            </Label>
            <Button
              asChild
              variant="link"
              size="sm"
              className="no-underline hover:*:[svg]:translate-x-1 *:[svg]:transition-transform"
            >
              <a
                href="https://github.com/Aktyn"
                target="_blank"
                rel="noreferrer"
              >
                Author repository&nbsp;
                <ExternalLink className="size-4 inline" />
              </a>
            </Button>
            <Button
              asChild
              variant="link"
              size="sm"
              className="no-underline hover:*:[svg]:translate-x-1 *:[svg]:transition-transform"
            >
              <a
                href="https://github.com/Aktyn/aktyn-assistant"
                target="_blank"
                rel="noreferrer"
              >
                Project repository&nbsp;
                <ExternalLink className="size-4 inline" />
              </a>
            </Button>
          </CardContent>
        </GlassCard>
        <GlassCard className="overflow-visible">
          <CardHeader className="text-xl font-bold justify-center">
            Versions
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-start">
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
          </CardContent>
        </GlassCard>
      </div>
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
