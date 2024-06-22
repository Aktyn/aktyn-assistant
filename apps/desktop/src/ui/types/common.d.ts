import type { ChatMessage } from '@aktyn-assistant/common'

declare global {
  function anime(params: anime.AnimeParams): anime.AnimeInstance
  declare type UiChatMessage = ChatMessage
}
