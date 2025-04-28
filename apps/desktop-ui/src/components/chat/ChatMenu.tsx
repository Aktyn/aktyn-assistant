import { useState } from 'react'
import { EllipsisVertical, X } from 'lucide-react'
import { Icon } from 'lucide-react'
import { broom } from '@lucide/lab'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DynamicIcon } from 'lucide-react/dynamic'
import { ChatMode, chatModeProps } from './helpers'
import { IconButton } from '../common/IconButton'

type ChatMenuProps = {
  mode: ChatMode
  setMode: (mode: ChatMode) => void
  onClearChat: () => void
  showRawResponse: boolean
  setShowRawResponse: (on: boolean) => void
  useHistory: boolean
  setUseHistory: (on: boolean) => void
  readChatResponses: boolean
  setReadChatResponses: (on: boolean) => void
}

export const ChatMenu = ({
  mode,
  setMode,
  onClearChat,
  showRawResponse,
  setShowRawResponse,
  useHistory,
  setUseHistory,
  readChatResponses,
  setReadChatResponses,
}: ChatMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          size="sm"
          className="options-menu-button border-1 border-divider"
          icon={EllipsisVertical}
          activeIcon={X}
          active={open}
        />
      </PopoverTrigger>
      <PopoverContent className="gap-y-2 py-2 items-center w-80">
        <div className="text-center font-bold text-foreground-400">
          Quick chat settings
        </div>
        <div className="h-px bg-default-700" />
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as ChatMode)}
          className="w-full"
        >
          <TabsList className="w-full bg-default-700 p-1">
            {Object.values(ChatMode).map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className="flex flex-row items-center gap-x-2 text-foreground-100 font-semibold"
              >
                <DynamicIcon name={chatModeProps[m].icon} size={20} />
                <span>{chatModeProps[m].title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="h-px bg-default-700" />
        <div className="flex flex-col gap-y-1 w-full">
          <label className="flex items-center gap-x-2 cursor-pointer">
            <Checkbox
              checked={!!showRawResponse}
              onCheckedChange={setShowRawResponse}
            />
            <span>Show raw response</span>
          </label>
          <label className="flex items-center gap-x-2 cursor-pointer">
            <Checkbox checked={!!useHistory} onCheckedChange={setUseHistory} />
            <span>Include chat history</span>
          </label>
          <label className="flex items-center gap-x-2 cursor-pointer">
            <Checkbox
              checked={!!readChatResponses}
              onCheckedChange={setReadChatResponses}
            />
            <span>Read chat responses</span>
          </label>
        </div>
        <div className="h-px bg-default-700" />
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={onClearChat}
        >
          <Icon iconNode={broom} size={16} className="mr-2" />
          Clear chat
        </Button>
      </PopoverContent>
    </Popover>
  )
}
