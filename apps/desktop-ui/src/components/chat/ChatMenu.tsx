import { useState } from 'react'
import { mdiBroom, mdiClose, mdiDotsVertical } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { Checkbox } from '@nextui-org/checkbox'
import {
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tab,
  Tabs,
} from '@nextui-org/react'
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
    <Popover
      placement="bottom-end"
      offset={8}
      radius="md"
      isOpen={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger>
        <IconButton
          size="sm"
          className="options-menu-button border-1 border-divider"
          icon={mdiDotsVertical}
          activeIcon={mdiClose}
          active={open}
        />
      </PopoverTrigger>
      <PopoverContent className="gap-y-2 py-2 items-center">
        <div className="text-center font-bold text-foreground-400">
          Quick chat settings
        </div>
        <Divider />
        <Tabs
          size="sm"
          radius="full"
          color="primary"
          variant="solid"
          selectedKey={mode}
          onSelectionChange={(selection) => setMode(selection as typeof mode)}
          classNames={{
            tabList: 'bg-default-700 p-1',
            tabContent: 'text-foreground-100 font-semibold',
          }}
        >
          {Object.values(ChatMode).map((mode) => (
            <Tab
              key={mode}
              title={
                <div className="flex flex-row items-center gap-x-2">
                  <Icon path={chatModeProps[mode].icon} size="1.25rem" />
                  <span>{chatModeProps[mode].title}</span>
                </div>
              }
            />
          ))}
        </Tabs>
        <Divider />
        <div className="flex flex-col gap-y-1">
          <Checkbox
            isSelected={!!showRawResponse}
            onValueChange={setShowRawResponse}
          >
            Show raw response
          </Checkbox>
          <Checkbox isSelected={!!useHistory} onValueChange={setUseHistory}>
            Include chat history
          </Checkbox>
          <Checkbox
            isSelected={!!readChatResponses}
            onValueChange={setReadChatResponses}
          >
            Read chat responses
          </Checkbox>
        </div>
        <Divider />
        <Button
          variant="flat"
          color="primary"
          size="sm"
          radius="full"
          startContent={<Icon path={mdiBroom} size="1rem" />}
          onClick={onClearChat}
        >
          Clear chat
        </Button>
      </PopoverContent>
    </Popover>
  )
}
