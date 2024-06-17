export abstract class ViewBase {
  constructor(public readonly content: HTMLDivElement) {}
  public abstract onOpen(): void
}
