import { useEffect, useRef, useState } from 'react'
import { mdiBroom, mdiClose, mdiDotsVertical } from '@mdi/js'
import Icon from '@mdi/react'
import { Button } from '@nextui-org/button'
import { Checkbox } from '@nextui-org/checkbox'
import { Divider } from '@nextui-org/divider'
import anime from 'animejs'
import './chat-menu.css'

type ChatMenuProps = {
  onClearChat: () => void
  showRawResponse: boolean
  setShowRawResponse: (on: boolean) => void
  useHistory: boolean
  setUseHistory: (on: boolean) => void
}

export const ChatMenu = ({
  onClearChat,
  showRawResponse,
  setShowRawResponse,
  useHistory,
  setUseHistory,
}: ChatMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    anime({
      targets: buttonRef.current,
      easing: 'spring(1, 80, 10, 0)',
      translateX: open ? '4rem' : '0rem',
      opacity: open ? 0 : 1,
    })
    anime({
      targets: optionsRef.current,
      easing: 'spring(1, 80, 10, 0)',
      translateX: open ? '0rem' : '-2rem',
      opacity: open ? 1 : 0,
    })
    anime({
      targets: optionsRef.current?.querySelectorAll(
        ':scope > *:not(.w-divider)',
      ),
      easing: 'spring(1, 80, 10, 0)',
      scale: open ? 1 : 0,
      opacity: open ? 1 : 0,
      delay: anime.stagger(200, { from: 'center' }),
    })
  }, [open])

  return (
    <>
      <Button
        ref={buttonRef}
        isIconOnly
        variant="light"
        size="sm"
        radius="full"
        className="options-menu-button icon-button !transition-background border-1 border-divider"
        onClick={() => setOpen(true)}
      >
        <Icon path={mdiDotsVertical} size="1.5rem" />
      </Button>
      <div
        ref={optionsRef}
        className={`${open ? 'active ' : ''}options -translate-x-4'`}
      >
        <Checkbox
          size="sm"
          color="primary"
          isSelected={!!showRawResponse}
          onValueChange={setShowRawResponse}
          classNames={{ label: 'text-inherit' }}
        >
          Show raw response
        </Checkbox>
        <Divider orientation="vertical" />
        <Checkbox
          size="sm"
          color="primary"
          isSelected={!!useHistory}
          onValueChange={setUseHistory}
          classNames={{ label: 'text-inherit' }}
        >
          Include chat history
        </Checkbox>
        <Divider orientation="vertical" />
        <Button
          className="!transition-background"
          variant="flat"
          color="primary"
          size="sm"
          radius="full"
          startContent={<Icon path={mdiBroom} size="1rem" />}
          onClick={onClearChat}
        >
          Clear chat
        </Button>
        <Divider orientation="vertical" />
        <Button
          className="!transition-background"
          size="sm"
          variant="light"
          color="primary"
          radius="full"
          isIconOnly
          onClick={() => setOpen(false)}
        >
          <Icon path={mdiClose} size="1rem" />
        </Button>
      </div>
    </>
  )
}
