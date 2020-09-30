import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';
import puppeteer from 'puppeteer';

import { executeCommand } from '../common/utils';

import { Prediction } from './../handpose/pipeline';

const googleChromePath = path.join(
  process.env['ProgramFiles(x86)'] || '',
  'Google',
  'Chrome',
  'Application',
  'chrome.exe'
);

export const chromiumExecutable = fs.existsSync(googleChromePath) ? googleChromePath : puppeteer.executablePath();

export default class GUI {
  private initPage: puppeteer.Page | null = null;

  constructor() {
    this.init();
  }

  getCameraSnapshot() {
    return this.initPage?.evaluate(() => {
      const video = document.querySelector<HTMLVideoElement>('#camera-preview')!;
      const canvas = document.querySelector<HTMLCanvasElement>('#camera-overlays')!;
      const ctx = canvas.getContext('2d', { antialias: false }) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 50);

      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      return data;
    });
  }

  async drawHandPose(prediction: Prediction) {
    return this.initPage?.evaluate((predictionString: string) => {
      console.log(predictionString);
      const canvas = document.querySelector<HTMLCanvasElement>('#camera-overlays')!;
      const ctx = canvas.getContext('2d', { antialias: false }) as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#fff6';
      ctx.fillStyle = '#fff6';
      ctx.lineWidth = 1;

      const prediction: Prediction = JSON.parse(predictionString);

      ctx.strokeRect(
        prediction.boundingBox.topLeft[0],
        prediction.boundingBox.topLeft[1],
        prediction.boundingBox.bottomRight[0] - prediction.boundingBox.topLeft[0],
        prediction.boundingBox.bottomRight[1] - prediction.boundingBox.topLeft[1]
      );

      for (const landmark of prediction.landmarks) {
        const size = 1 - Math.max(0, (128.0 + landmark[2]) / 256.0);

        ctx.beginPath();
        ctx.arc(landmark[0], landmark[1], 1 + size * 8, 0, Math.PI * 2, false);
        ctx.fill();
      }

      const fingerLookupIndices: { [index: string]: number[] } = {
        thumb: [0, 1, 2, 3, 4],
        indexFinger: [0, 5, 6, 7, 8],
        middleFinger: [0, 9, 10, 11, 12],
        ringFinger: [0, 13, 14, 15, 16],
        pinky: [0, 17, 18, 19, 20]
      };

      const palette = ['#faa', '#afa', '#aaf', '#ffa', '#faf', '#aff'];

      const fingers = Object.keys(fingerLookupIndices);
      for (let i = 0; i < fingers.length; i++) {
        const finger = fingers[i];
        const points = fingerLookupIndices[finger].map(idx => prediction.landmarks[idx]);

        ctx.strokeStyle = palette[i % palette.length];
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          ctx.lineTo(point[0], point[1]);
        }
        ctx.stroke();
      }
    }, JSON.stringify(prediction));
  }

  async clearHandPose() {
    this.initPage?.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#camera-overlays')!;
      const ctx = canvas.getContext('2d', { antialias: false }) as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  async init() {
    const DEBUG_PORT = 9223;
    const PREVIEW_WIDTH = 640,
      PREVIEW_HEIGHT = 480;

    const chrome_args = `--content-shell-host-window-size=1280x720 --no-default-browser-check --no-first-run --remote-debugging-port=${DEBUG_PORT}`;
    executeCommand(
      `"${chromiumExecutable}" --app="http://localhost" --user-data-dir="${path.join(
        process.env.TEMP || __dirname,
        'tempProfile'
      )}" ${chrome_args}`
    )
      .then(() => {
        console.log('Chrome instance closed');
        process.exit(0);
      })
      .catch(e => {
        console.error('Cannot open google chrome: ' + e);
      });

    const version = await fetch(`http://localhost:${DEBUG_PORT}/json/version`).then(res => res.json());
    console.log(version.webSocketDebuggerUrl);

    const browser = await puppeteer.connect({
      browserWSEndpoint: version.webSocketDebuggerUrl
    });

    const pages = await browser.pages();
    this.initPage = pages[0] || (await browser.newPage());
    this.initPage.setViewport({
      width: 1280,
      height: 720
    });
    await this.initPage.goto(`file://${path.join(__dirname, '..', '..', 'gui', 'index.html')}`);

    const initialized = await this.initPage.evaluate(
      (width: number, height: number) =>
        new Promise((resolve, reject) => {
          const container = document.querySelector<HTMLDivElement>('#preview-container');
          container && (container.style.width = `${width}px`);
          container && (container.style.height = `${height}px`);

          const video = document.querySelector<HTMLVideoElement>('#camera-preview');
          if (!video) {
            return resolve(false);
          }
          video && (video.style.width = `${width}px`);
          video && (video.style.height = `${height}px`);

          const canvas = document.querySelector<HTMLCanvasElement>('#camera-overlays')!;
          canvas.width = width;
          canvas.height = height;

          navigator.mediaDevices
            .getUserMedia({ audio: true, video: true }) //TODO: smarter camera device selection
            .then(stream => {
              video.onerror = reject;
              video.srcObject = stream;
              video.onplay = () => {
                console.log('Video plays!');
                resolve(true);
              };
              video.play();
              video.volume = 0;
            })
            .catch(error => {
              console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
            });
        }),
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT
    );

    if (!initialized) {
      throw new Error('Cannot initialize camera preview');
    }
  }
}
