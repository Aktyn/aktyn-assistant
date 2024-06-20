export abstract class ViewBase {
  protected opened = false

  constructor(public readonly content: HTMLDivElement) {}
  public onOpen() {
    this.opened = true
  }
  public onClose() {
    this.opened = false
  }

  public abstract onExternalData(data: {
    autoLaunchEnabled: boolean
    version?: string
  }): void
}
