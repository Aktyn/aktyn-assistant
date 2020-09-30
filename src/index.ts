import * as tf from '@tensorflow/tfjs-node-gpu';

import { wait } from './common/utils';
import GUI from './gui';
import { load as loadHandposeModel } from './handpose';

interface AssistantOptions {}

export class Assistant {
  private readonly gui: GUI | null;

  constructor(opts: AssistantOptions) {
    console.log(opts);

    this.gui = new GUI();
    this.startHandGesturesRecognition();

    //TODO: start speech recognition with puppeteer's evaluate
  }

  private async startHandGesturesRecognition() {
    const model = await loadHandposeModel();

    let emptyFrames = 0;

    while (this.gui) {
      const snapshot = await this.gui.getCameraSnapshot();

      if (!snapshot) {
        await wait(1000);
        continue;
      }

      const input = tf.node.decodeJpeg(Buffer.from(snapshot.substr('data:image/jpeg;base64,'.length), 'base64'));
      const hands = await model.estimateHands(input);
      input.dispose();
      if (hands.length) {
        emptyFrames = 0;
        for (const hand of hands) {
          this.gui?.drawHandPose(hand);
        }
      } else {
        if (emptyFrames++ > 8) {
          emptyFrames = 0;
          this.gui?.clearHandPose();
        }
      }

      // await wait(16);
    }
  }
}
