import * as tfconv from '@tensorflow/tfjs-converter';
import * as tf from '@tensorflow/tfjs-node-gpu';

import { HandDetector } from './hand';
import { HandPipeline, Prediction } from './pipeline';

// Load the bounding box detector model.
async function loadHandDetectorModel() {
  const HANDDETECT_MODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1';
  return tfconv.loadGraphModel(HANDDETECT_MODEL_PATH, { fromTFHub: true });
}

const MESH_MODEL_INPUT_WIDTH = 256;
const MESH_MODEL_INPUT_HEIGHT = 256;

// Load the mesh detector model.
async function loadHandPoseModel() {
  const HANDPOSE_MODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1';
  return tfconv.loadGraphModel(HANDPOSE_MODEL_PATH, { fromTFHub: true });
}

// In single shot detector pipelines, the output space is discretized into a set
// of bounding boxes, each of which is assigned a score during prediction. The
// anchors define the coordinates of these boxes.
async function loadAnchors() {
  return tf.util
    .fetch('https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file')
    .then((d: any) => d.json());
}

// interface AnnotatedPrediction extends Prediction {
//   annotations: {[key: string]: Array<[number, number, number]>};
// }

export async function load({
  maxContinuousChecks = Infinity,
  detectionConfidence = 0.8,
  iouThreshold = 0.3,
  scoreThreshold = 0.5
} = {}) {
  const [ANCHORS, handDetectorModel, handPoseModel] = await Promise.all([
    loadAnchors(),
    loadHandDetectorModel(),
    loadHandPoseModel()
  ]);

  const detector = new HandDetector(
    handDetectorModel,
    MESH_MODEL_INPUT_WIDTH,
    MESH_MODEL_INPUT_HEIGHT,
    ANCHORS,
    iouThreshold,
    scoreThreshold
  );
  const pipeline = new HandPipeline(
    detector,
    handPoseModel,
    MESH_MODEL_INPUT_WIDTH,
    MESH_MODEL_INPUT_HEIGHT,
    maxContinuousChecks,
    detectionConfidence
  );
  return new HandPose(pipeline);
}

function getInputTensorDimensions(input: any) {
  return input instanceof tf.Tensor ? [input.shape[0], input.shape[1]] : [input.height, input.width];
}

function flipHandHorizontal(prediction: Prediction, width: number): Prediction {
  const { handInViewConfidence, landmarks, boundingBox } = prediction;
  return {
    handInViewConfidence,
    landmarks: landmarks.map((coord: any) => {
      return [width - 1 - coord[0], coord[1], coord[2]];
    }),
    boundingBox: {
      topLeft: [width - 1 - boundingBox.topLeft[0], boundingBox.topLeft[1]],
      bottomRight: [width - 1 - boundingBox.bottomRight[0], boundingBox.bottomRight[1]]
    }
  };
}

export const MESH_ANNOTATIONS: { [index: string]: number[] } = {
  thumb: [1, 2, 3, 4],
  indexFinger: [5, 6, 7, 8],
  middleFinger: [9, 10, 11, 12],
  ringFinger: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
  palmBase: [0]
};

class HandPose {
  private readonly pipeline: HandPipeline;

  constructor(pipeline: HandPipeline) {
    this.pipeline = pipeline;
  }

  static getAnnotations() {
    return MESH_ANNOTATIONS;
  }

  /**
   * Finds hands in the input image.
   *
   * @param input The image to classify. Can be a tensor, DOM element image,
   * video, or canvas.
   * @param flipHorizontal Whether to flip the hand keypoints horizontally.
   * Should be true for videos that are flipped by default (e.g. webcams).
   */
  async estimateHands(
    input: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    flipHorizontal = false
  ): Promise<Prediction[]> {
    const [, width] = getInputTensorDimensions(input);

    const image = tf.tidy(() => {
      if (!(input instanceof tf.Tensor)) {
        input = tf.browser.fromPixels(input);
      }

      return input.toFloat().expandDims(0) as tf.Tensor4D;
    });

    const result = await this.pipeline.estimateHand(image);
    image.dispose();

    if (result === null) {
      return [];
    }

    let prediction = result;
    if (flipHorizontal === true) {
      prediction = flipHandHorizontal(result, width);
    }

    const annotations: { [index: string]: [number, number, number][] } = {};
    for (const key of Object.keys(MESH_ANNOTATIONS)) {
      annotations[key] = MESH_ANNOTATIONS[key].map(index => prediction.landmarks[index]);
    }

    return [
      {
        handInViewConfidence: prediction.handInViewConfidence,
        boundingBox: prediction.boundingBox,
        landmarks: prediction.landmarks,
        annotations
      }
    ];
  }
}
