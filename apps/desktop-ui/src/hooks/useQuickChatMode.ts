import { once } from '@aktyn-assistant/common'

export function useQuickChatMode() {
  return isQuickChatMode()
}

const isQuickChatMode = once(
  () => new URLSearchParams(location.search).get('mode') === 'quick-chat',
)
