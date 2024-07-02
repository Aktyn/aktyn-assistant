import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatBytes } from '@aktyn-assistant/common'
import { mdiFile, mdiFolder, mdiFolderArrowUp, mdiFolderOpen } from '@mdi/js'
import Icon from '@mdi/react'
import { BreadcrumbItem, Breadcrumbs } from '@nextui-org/breadcrumbs'
import { Button } from '@nextui-org/button'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@nextui-org/dropdown'
import { cn } from '@nextui-org/react'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { Spacer } from '@nextui-org/spacer'
import path from 'path-browserify'
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
          <ScrollShadow
            className="flex flex-col items-start gap-y-1 max-h-56 pr-2"
            style={{ minHeight: height }}
          >
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
            <Spacer y={1} />
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
          </ScrollShadow>
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

  return (
    <div className="flex flex-row items-center gap-x-4">
      <Icon
        path={mdiFolderOpen}
        size="2rem"
        className="text-foreground-400 min-w-8"
      />
      <Breadcrumbs
        variant="bordered"
        radius="full"
        maxItems={4}
        itemsAfterCollapse={4}
        itemsBeforeCollapse={0}
        renderEllipsis={({ items, ellipsisIcon, separator }) => (
          <div key="ellipsis" className="flex items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="min-w-6 w-6 h-6"
                  size="sm"
                  variant="flat"
                >
                  {ellipsisIcon}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disabledKeys={Array.from({
                  length: originalParts.length - 1,
                }).map((_, index) => index.toString())}
              >
                {items.map((item, index2) => (
                  <DropdownItem
                    key={index2}
                    onClick={() =>
                      index2 >= originalParts.length - 1 && goTo(parts, index2)
                    }
                  >
                    {item.children}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {separator}
          </div>
        )}
        className="*:border-1 *:border-divider/20"
      >
        {parts.map((part, index) => (
          <BreadcrumbItem
            key={`${part}-${index}`}
            className="last-of-type:font-bold"
            isDisabled={index < originalParts.length - 1}
            onPress={() => goTo(parts, index)}
          >
            {part}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
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
      className="flex flex-row items-center gap-x-2 w-full px-2 rounded-md cursor-pointer hover:bg-primary-200/20 transition-background"
      onClick={onClick}
    >
      <Icon
        path={isReturn ? mdiFolderArrowUp : mdiFolder}
        size="1.5rem"
        className="text-foreground-400"
      />
      <span>{name}</span>
      {entriesCount > 0 && (
        <span className="ml-auto text-foreground-400 text-sm">
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
        'flex flex-row items-center justify-start gap-x-2 w-full px-2 rounded-md transition-background',
        selected && 'bg-primary-400/50',
        !selected && 'cursor-pointer hover:bg-primary-200/20',
      )}
      onClick={onClick}
    >
      <Icon path={mdiFile} size="1.5rem" className="text-foreground-400" />
      <span>{file.name}</span>
      <span className="ml-auto text-foreground-400 text-sm">
        {formatBytes(file.size)}
      </span>
    </div>
  )
}

function splitPath(pathValue: string) {
  return pathValue.split(path.sep).filter(Boolean)
}
