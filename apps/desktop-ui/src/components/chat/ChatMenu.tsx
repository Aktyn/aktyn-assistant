import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlobalContext } from '@/context/GlobalContextProvider'
import { ViewType } from '@/utils/navigation'
import { EllipsisVertical, Settings, Shredder, X } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useContext, useState } from 'react'
import { IconButton } from '../common/IconButton'
import { Separator } from '../ui/separator'
import { ChatMode, chatModeProps } from './helpers'

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
  const { setView } = useContext(GlobalContext)

  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          size="sm"
          className="absolute right-4 top-4 size-8 z-10 self-end backdrop-blur-sm border"
          icon={EllipsisVertical}
          activeIcon={X}
          active={open}
        />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-y-2 py-2 px-0 items-stretch min-w-96">
        <Button
          variant="link"
          className="self-center"
          onClick={() => {
            setView(ViewType.Settings)
            setOpen(false)
          }}
        >
          <Settings />
          See all settings
        </Button>
        <Separator />
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as ChatMode)}
          className="w-full px-4"
        >
          <TabsList className="w-full p-2 h-auto grid grid-cols-2">
            {Object.values(ChatMode).map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className="flex flex-row items-center gap-x-2 text-foreground font-semibold"
              >
                <DynamicIcon name={chatModeProps[m].icon} size={20} />
                <span>{chatModeProps[m].title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Separator />
        <div className="flex flex-col gap-y-1 w-full px-4">
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
        <Separator />
        <Button variant="outline" onClick={onClearChat} className="mx-4">
          <Shredder />
          Clear chat
        </Button>
      </PopoverContent>
    </Popover>
  )
}
