import { useEffect, useState } from 'react'
import type { BuiltInToolInfo, ToolInfo } from '@aktyn-assistant/core'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Dialog } from './Dialog'
import { NotificationMessage } from '../common/NotificationMessage'

type OmitKey = keyof Omit<BuiltInToolInfo, 'schema' | 'enabled' | 'builtIn'>

const omitInOptions: {
  [key in OmitKey]: {
    label: string
  }
} = {
  omitInRegularChat: { label: 'Regular chat' },
  omitInQuickChat: { label: 'Quick chat' },
  omitInQuickCommand: { label: 'Quick command' },
  omitInVoiceCommand: { label: 'Voice command' },
}

type ToolEditDialogProps = {
  tool: ToolInfo
  open: boolean
  onClose: (edited?: boolean) => void
}

export const ToolEditDialog = ({
  open,
  onClose,
  tool,
}: ToolEditDialogProps) => {
  const [omitIn, setOmitIn] = useState<OmitKey[]>([])

  useEffect(() => {
    if (!open) {
      return
    }
    setOmitIn(
      () =>
        Object.keys(omitInOptions).filter(
          (omitKey) => tool[omitKey as OmitKey],
        ) as OmitKey[],
    )
  }, [open, tool])

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={
        <div className="flex flex-row items-center gap-x-1 text-nowrap flex-nowrap">
          <span>Edit tool:</span>
          <span className="font-bold">{tool.schema.functionName}</span>
        </div>
      }
      onCancel={onClose}
      onConfirm={() => {
        window.electronAPI
          .editTool({
            ...tool,
            omitInRegularChat: omitIn.includes('omitInRegularChat'),
            omitInQuickChat: omitIn.includes('omitInQuickChat'),
            omitInQuickCommand: omitIn.includes('omitInQuickCommand'),
            omitInVoiceCommand: omitIn.includes('omitInVoiceCommand'),
          })
          .then(() => onClose(true))
          .catch((error) => {
            toast.error('Failed to edit tool', {
              description: (
                <NotificationMessage
                  title="Failed to edit tool"
                  message={error}
                  copyable
                />
              ),
              duration: Infinity,
              closeButton: true,
            })
          })
      }}
    >
      <div className="flex flex-col gap-2">
        <Label className="font-semibold">Omit in:</Label>
        {Object.entries(omitInOptions).map(([key, { label }]) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`omit-${key}`}
              checked={omitIn.includes(key as OmitKey)}
              onCheckedChange={(checked: boolean) => {
                const currentOmitIn = [...omitIn]
                if (checked) {
                  currentOmitIn.push(key as OmitKey)
                } else {
                  const index = currentOmitIn.indexOf(key as OmitKey)
                  if (index > -1) {
                    currentOmitIn.splice(index, 1)
                  }
                }
                setOmitIn(currentOmitIn)
              }}
            />
            <Label htmlFor={`omit-${key}`}>{label}</Label>
          </div>
        ))}
      </div>
      {/* TODO: allow editing description and parameters */}
    </Dialog>
  )
}
