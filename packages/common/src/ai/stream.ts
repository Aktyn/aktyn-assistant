import type { ChatResponse } from './chat'

class Stream<Item> implements AsyncIterable<Item> {
  controller: AbortController

  constructor(
    private iterator: () => AsyncGenerator<Item>,
    controller: AbortController,
  ) {
    this.controller = controller
  }

  [Symbol.asyncIterator](): AsyncGenerator<Item> {
    return this.iterator()
  }
}

export const ChatStream = Stream<ChatResponse>
