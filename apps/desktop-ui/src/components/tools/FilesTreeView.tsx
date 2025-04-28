import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatBytes } from '@aktyn-assistant/common'
import { File, Folder, FolderOpen, FolderUp } from 'lucide-react'
import path from 'path-browserify'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FilesTree, FixedFile } from '../../utils/file-helpers'
import { AutoSizer } from '../common/AutoSizer'

type FilesTreeViewProps = {
  filesTree: FilesTree
  onFileSelected: (file: FixedFile | null) => void
}

export const FilesTreeView = ({
  filesTree,
  onFileSelected,
}: FilesTreeViewProps) => {
  const [localTree, setLocalTree] = useState(filesTree)
  const [selectedFile, setSelectedFile] = useState<FixedFile | null>(null)

  useEffect(() => {
    setLocalTree(filesTree)
  }, [filesTree])

  useEffect(() => {
    if (localTree) {
      setSelectedFile(null)
      onFileSelected(null)
    }
  }, [localTree, onFileSelected])

  const originalParts = useMemo(
    () => splitPath(filesTree.path),
    [filesTree.path],
  )

  const goTo = useCallback(
    (parts: string[], index: number) => {
      const relativeParts = parts.slice(originalParts.length, index + 1)
      let targetTree = filesTree
      for (const part of relativeParts) {
        targetTree = targetTree.directories[part]
      }
      setLocalTree(targetTree)
    },
    [filesTree, originalParts.length],
  )

  return (
    <div className="flex flex-col items-stretch justify-start gap-y-2">
      <PathBar
        path={localTree.path}
        originalPath={filesTree.path}
        goTo={goTo}
      />
      <AutoSizer>
        {({ height }) => (
          <ScrollArea
            className="flex flex-col items-start gap-y-1 max-h-56 pr-2 border rounded-md"
            style={{ minHeight: height }}
          >
            <div className="p-2">
              {localTree !== filesTree && (
                <DirectoryEntry
                  name="Go up"
                  isReturn
                  onClick={() => {
                    const currentParts = splitPath(localTree.path)
                    goTo(currentParts, currentParts.length - 2)
                  }}
                />
              )}
              {Object.entries(localTree.directories).map(([name, tree]) => (
                <DirectoryEntry
                  key={name}
                  name={name}
                  entriesCount={
                    tree.files.length + Object.keys(tree.directories).length
                  }
                  onClick={() => setLocalTree(tree)}
                />
              ))}
              <div className="my-2" />
              {localTree.files.map((file) => (
                <FileEntry
                  key={file.path}
                  file={file}
                  selected={file === selectedFile}
                  onClick={() => {
                    setSelectedFile(file)
                    onFileSelected(file)
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </AutoSizer>
    </div>
  )
}

type PathBarProps = {
  path: string
  originalPath: string
  goTo: (parts: string[], index: number) => void
}

const PathBar = ({ path: pathValue, originalPath, goTo }: PathBarProps) => {
  const parts = useMemo(() => splitPath(pathValue), [pathValue])
  const originalParts = useMemo(() => splitPath(originalPath), [originalPath])
  const MAX_ITEMS = 4

  return (
    <div className="flex flex-row items-center gap-x-4">
      <FolderOpen size="2rem" className="text-muted-foreground min-w-8" />
      <Breadcrumb>
        <BreadcrumbList>
          {parts.slice(0, originalParts.length - 1).map((part, index) => (
            <BreadcrumbItem key={`${part}-${index}`}>
              <BreadcrumbLink asChild>
                <span className="cursor-not-allowed text-muted-foreground">
                  {part}
                </span>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
          ))}

          {parts.length > MAX_ITEMS &&
          parts.length - (originalParts.length - 1) > 1 ? (
            <>
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {parts
                      .slice(originalParts.length - 1, parts.length - 1)
                      .map((part, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() =>
                            goTo(parts, originalParts.length - 1 + index)
                          }
                        >
                          {part}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : (
            parts
              .slice(originalParts.length - 1, parts.length - 1)
              .map((part, index) => (
                <BreadcrumbItem key={`${part}-${index}`}>
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goTo(parts, originalParts.length - 1 + index)
                    }}
                  >
                    {part}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </BreadcrumbItem>
              ))
          )}

          <BreadcrumbItem>
            <BreadcrumbPage>{parts[parts.length - 1]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

type DirectoryEntryProps = {
  name: string
  entriesCount?: number
  onClick: () => void
  isReturn?: boolean
}

const DirectoryEntry = ({
  name,
  entriesCount = 0,
  onClick,
  isReturn,
}: DirectoryEntryProps) => {
  return (
    <div
      className="flex flex-row items-center gap-x-2 w-full p-2 rounded-md cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      {isReturn ? (
        <FolderUp size="1.5rem" className="text-muted-foreground" />
      ) : (
        <Folder size="1.5rem" className="text-muted-foreground" />
      )}
      <span>{name}</span>
      {entriesCount > 0 && (
        <span className="ml-auto text-muted-foreground text-sm">
          {entriesCount}&nbsp;{entriesCount === 1 ? 'entry' : 'entries'}
        </span>
      )}
    </div>
  )
}

type FileEntryProps = {
  file: FixedFile
  selected: boolean
  onClick: () => void
}

const FileEntry = ({ file, selected, onClick }: FileEntryProps) => {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-start gap-x-2 w-full p-2 rounded-md transition-colors',
        selected && 'bg-primary/50 text-primary-foreground',
        !selected && 'cursor-pointer hover:bg-accent',
      )}
      onClick={onClick}
    >
      <File size="1.5rem" className="text-muted-foreground" />
      <span>{file.name}</span>
      <span className="ml-auto text-muted-foreground text-sm">
        {formatBytes(file.size)}
      </span>
    </div>
  )
}

function splitPath(pathValue: string) {
  return pathValue.split(path.sep).filter(Boolean)
}
