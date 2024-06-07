import type { InterfaceAPI } from '@aktyn-assistant/common'

export enum INTERFACE_VIEW {
  Chat = 'chat',
  Settings = 'settings',
}

export abstract class View {
  constructor(
    public readonly type: INTERFACE_VIEW,
    protected readonly handleError: (error: unknown) => void,
    protected readonly onReturnToMenu: () => void,
    protected readonly api: InterfaceAPI,
  ) {}

  abstract abortAsynchronousActions(): void
  abstract open(): void
}
