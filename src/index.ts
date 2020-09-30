import GUI from './gui';

interface AssistantOptions {}

export class Assistant {
  //@ts-ignore
  private readonly gui: GUI | null;

  constructor(opts: AssistantOptions) {
    console.log(opts);
    this.gui = new GUI();
  }
}
