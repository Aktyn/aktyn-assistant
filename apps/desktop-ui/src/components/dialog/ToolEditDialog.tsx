import { useEffect, useState } from 'react'
import type { BuiltInToolInfo, ToolInfo } from '@aktyn-assistant/core'
import { Checkbox, CheckboxGroup } from '@nextui-org/checkbox'
import { closeSnackbar, enqueueSnackbar } from 'notistack'
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
            const key = enqueueSnackbar({
              variant: 'error',
              message: (
                <NotificationMessage
                  title="Failed to edit tool"
                  message={error}
                  copyable
                  onClose={() => closeSnackbar(key)}
                />
              ),
            })
          })
      }}
    >
      <CheckboxGroup
        label="Omit in:"
        value={omitIn}
        onValueChange={(selection) => {
          setOmitIn(selection as OmitKey[])
        }}
      >
        {Object.entries(omitInOptions).map(([key, { label }]) => (
          <Checkbox key={key} value={key}>
            {label}
          </Checkbox>
        ))}
      </CheckboxGroup>
      {/* TODO: allow editing description and parameters */}
    </Dialog>
  )
}
