import { Menu } from '../../../desktop-ui/src/deprecated/circularMenu'
import { Dialog } from './components/common/dialog'
import { Notifications } from './components/common/notifications'
import { TitleHeader } from './titleHeader'
import { createElement } from './utils/dom'
import { ChatView } from './views/chat'

async function initQuickChat() {
  const view = new ChatView()
  view.onOpen()
  document.body.appendChild(view.content)
}

// Object.defineProperty(window, 'initMain', { value: initMain })
Object.defineProperty(window, 'initQuickChat', { value: initQuickChat })
