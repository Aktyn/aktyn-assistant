import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ChangeEventHandler,
  type DragEventHandler,
} from 'react'
import { Loader2, FolderDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMounted } from '../../hooks/useMounted'
import {
  buildFilesTree,
  getAllFileEntries,
  isFixedFile,
  type FilesTree,
} from '../../utils/file-helpers'

type DragDropAreaProps = {
  onChange: (tree: FilesTree) => void
}

export const DragDropArea = forwardRef<HTMLDivElement, DragDropAreaProps>(
  ({ onChange }, forwardRef) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mounted = useMounted()

    const [isDragOver, setIsDragOver] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleDrop = useCallback<DragEventHandler<HTMLDivElement>>(
      async (event) => {
        event.preventDefault()
        setIsDragOver(false)
        setLoading(true)

        const files = await getAllFileEntries(event.dataTransfer.items)
        if (files.length) {
          const tree = buildFilesTree(files)
          if (mounted.current) {
            setLoading(false)
            onChange(tree)
          }
        } else {
          setLoading(false)
          console.warn('No files found in the drag and drop operation')
        }
      },
      [mounted, onChange],
    )

    const handleFileSelect = useCallback<ChangeEventHandler<HTMLInputElement>>(
      (event) => {
        if (!event.target.webkitdirectory) {
          return
        }

        setLoading(true)

        const { files: fileList } = event.target
        const files = Array.from(fileList ?? [])
        if (files.length && files.every(isFixedFile)) {
          const tree = buildFilesTree(files)
          if (mounted.current) {
            setLoading(false)
            onChange(tree)
          }
        } else {
          setLoading(false)
          console.warn('No files selected')
        }
      },
      [mounted, onChange],
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
        {loading ? (
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
        ) : (
          <FolderDown className="w-20 h-20 pointer-events-none text-primary" />
        )}
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
