export class Stream<Item> implements AsyncIterable<Item> {
  constructor(
    private readonly iterator: () => AsyncGenerator<Item>,
    readonly controller: AbortController,
  ) {}

  [Symbol.asyncIterator](): AsyncGenerator<Item> {
    return this.iterator()
  }
}
