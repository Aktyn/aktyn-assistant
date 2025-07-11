import { Check, Copy, X } from 'lucide-react'
import { useState } from 'react'
import { useMounted } from '../../hooks/useMounted'
import { IconButton } from './IconButton'

type NotificationMessageProps = {
  title?: string
  message: string
  onClose?: () => void
  copyable?: boolean
}

export const NotificationMessage = ({
  title,
  message,
  onClose,
  copyable,
}: NotificationMessageProps) => {
  const mounted = useMounted()

  const [copySuccess, setCopySuccess] = useState(false)

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    if (!mounted.current) return
    setCopySuccess(true)
    setTimeout(() => mounted.current && setCopySuccess(false), 2000)
  }

  return (
    <div className="flex flex-row items-center justify-between gap-4 w-full pr-2">
      <div className="flex flex-col items-start">
        {title && <div className="font-bold">{title}</div>}
        <div>{message}</div>
      </div>
      <div className="flex flex-row items-center">
        {copyable && (
          <IconButton
            size="sm"
            icon={copySuccess ? Check : Copy}
            disabled={copySuccess}
            onClick={copyMessage}
          />
        )}
        {onClose && <IconButton size="sm" onClick={onClose} icon={X} />}
      </div>
    </div>
  )
}
