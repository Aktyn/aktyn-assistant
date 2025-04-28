import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Info, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { FilesTree, FixedFile } from '../../utils/file-helpers'
import { DragDropArea } from '../common/DragDropArea'
import { NotificationMessage } from '../common/NotificationMessage'
import { Dialog } from '../dialog/Dialog'
import { FilesTreeView } from './FilesTreeView'

type AddToolDialogProps = {
  open: boolean
  onClose: (success?: boolean) => void
}

export const AddToolDialog = ({ open, onClose }: AddToolDialogProps) => {
  const dragDropAreaContainerRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)

  const [filesTree, setFilesTree] = useState<FilesTree | null>(null)
  const [showFilesTree, setShowFilesTree] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FixedFile | null>(null)
  const [addingTool, setAddingTool] = useState(false)

  const onFilesSelected = useCallback(
    (tree: FilesTree) => {
      setFilesTree(tree)
      setShowFilesTree(true)
    },
    [setFilesTree, setShowFilesTree],
  )

  useEffect(() => {
    if (open) {
      setFilesTree(null)
      setShowFilesTree(false)
      setSelectedFile(null)
      setAddingTool(false)
    }
  }, [open])

  //TODO: Add animation
  // useEffect(() => {
  //   anime({
  //     targets: dragDropAreaContainerRef.current,
  //     easing: 'easeInOutSine',
  //     duration: 400,
  //     scale: showFilesTree ? 0.618 : 1,
  //     opacity: showFilesTree ? 0 : 1,
  //   })
  //   anime({
  //     targets: formContainerRef.current,
  //     easing: 'easeInOutSine',
  //     duration: 400,
  //     scale: showFilesTree ? [0.618, 1] : 0.618,
  //     opacity: showFilesTree ? [0, 1] : 0,
  //     complete: () => formContainerRef.current?.querySelector('input')?.focus(),
  //   })
  //   anime({
  //     targets: formContainerRef.current?.querySelectorAll(':scope > *'),
  //     easing: 'spring(1, 80, 10, 0)',
  //     opacity: showFilesTree ? [0, 1] : [1, 0],
  //     translateY: showFilesTree ? ['-2rem', '0rem'] : ['0rem', '-2rem'],
  //     delay: anime.stagger(200, { from: 'first' }),
  //   })
  // }, [showFilesTree])

  const handleConfirm = useCallback(() => {
    if (!selectedFile || !filesTree) {
      return
    }

    setAddingTool(true)
    window.electronAPI
      .addToolsSource({
        sourceDirectory: filesTree.path,
        mainFile: selectedFile.path,
      })
      .then((error) => {
        setAddingTool(false)
        if (!error) {
          toast.success('Tool added')
          onClose(true)
        } else {
          toast.error('Failed to add tool', {
            description: (
              <NotificationMessage
                title="Failed to add tool"
                message={error}
                copyable
              />
            ),
            duration: Infinity,
            closeButton: true,
          })
        }
      })
      .catch((error) => {
        setAddingTool(false)
        console.error(error)
      })
  }, [filesTree, onClose, selectedFile])

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      isDismissable={false}
      title={
        <div className="w-full flex flex-row items-center justify-between gap-2">
          <span>Add tool</span>
          <Button
            className={cn(
              'opacity-100 transition-opacity',
              !filesTree ? 'opacity-0 pointer-events-none' : '',
            )}
            variant="ghost"
            onClick={() => setShowFilesTree(false)}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Start over
          </Button>
        </div>
      }
      onCancel={onClose}
      onConfirm={handleConfirm}
      disableConfirmButton={!selectedFile}
      isLoading={addingTool}
      // bodyProps={{
      //   className: cn(
      //     'grid transition-[grid-template-rows] delay-500',
      //     showFilesTree && 'grid-rows-[0fr_1fr]',
      //     !showFilesTree && 'grid-rows-[1fr_0fr]',
      //   ),
      // }}
    >
      <div
        ref={dragDropAreaContainerRef}
        className={cn(showFilesTree && 'pointer-events-none overflow-hidden')}
      >
        <DragDropArea onChange={onFilesSelected} />
      </div>
      <div
        ref={formContainerRef}
        className={cn(
          'opacity-0 flex flex-col gap-y-4',
          !showFilesTree && 'pointer-events-none overflow-hidden',
        )}
      >
        <div
          className={cn(
            'text-lg font-semibold flex flex-row items-center gap-x-2 transition-colors',
            !selectedFile?.path.endsWith('.js') && 'text-deepOrange-200',
            selectedFile?.path.endsWith('.js') && 'text-green-200',
          )}
        >
          <span>Select main tool file from the directory (.js)</span>
          <MainToolFileInfo />
        </div>
        {filesTree && (
          <FilesTreeView
            filesTree={filesTree}
            onFileSelected={setSelectedFile}
          />
        )}
      </div>
    </Dialog>
  )
}

const MainToolFileInfo = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Info size="1.25rem" className="text-blue-400" />
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col max-w-96 gap-y-1 text-balance">
          <span>
            This must be a <b>NodeJS</b> file that exports a function that
            returns an array of <b>tool</b> objects (&nbsp;
            <i>{`{schema: ..., function: ...}`}</i>&nbsp;)
          </span>
          <span>
            Such a file is usually named as <i>index.js</i> or <i>main.js</i>
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
