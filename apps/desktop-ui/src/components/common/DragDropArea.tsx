import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ChangeEventHandler,
  type DragEventHandler,
} from 'react'
import { mdiFolderDownloadOutline } from '@mdi/js'
import Icon from '@mdi/react'
import { cn } from '@nextui-org/react'
import {
  buildFilesTree,
  type FilesTree,
  getAllFileEntries,
  type FixedFile,
} from '../../utils/file-helpers'

type DragDropAreaProps = {
  onChange: (tree: FilesTree) => void
}

export const DragDropArea = forwardRef<HTMLDivElement, DragDropAreaProps>(
  ({ onChange }, forwardRef) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isDragOver, setIsDragOver] = useState(false)

    const handleDrop = useCallback<DragEventHandler<HTMLDivElement>>(
      async (event) => {
        event.preventDefault()
        setIsDragOver(false)

        const files = await getAllFileEntries(event.dataTransfer.items)
        if (files.length) {
          onChange(buildFilesTree(files))
        }
      },
      [onChange],
    )

    const handleFileSelect = useCallback<ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        if (!event.target.webkitdirectory) {
          return
        }

        const { files: fileList } = event.target
        const files = Array.from(fileList ?? []) as FixedFile[]
        if (files.length) {
          onChange(buildFilesTree(files))
        }
      },
      [onChange],
    )

    return (
      <div
        ref={forwardRef}
        className={cn(
          'flex flex-row items-center justify-center gap-4 border-2 border-dashed border-divider rounded-2xl p-8 bg-divider/10 cursor-pointer transition-colors text-foreground-200 hover:bg-divider/20 hover:text-foreground-50 hover:border-foreground-50 shadow-xl my-4',
          isDragOver && 'border-primary-400 text-primary-100 bg-primary-200/20',
        )}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          //@ts-expect-error webkitdirectory is not supported in all browsers
          webkitdirectory="true"
          multiple={false}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Icon
          path={mdiFolderDownloadOutline}
          size="5rem"
          className="pointer-events-none"
        />
        <div className="flex flex-col items-start pointer-events-none">
          <span className="font-bold text-lg text-balance">
            Choose files or directory from your device or drop it here
          </span>
          <span className="opacity-70 text-sm text-balance">
            It&apos;s best to select directory containing all files required by
            the tool
          </span>
        </div>
      </div>
    )
  },
)
