import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';
import puppeteer from 'puppeteer';

import { executeCommand } from '../common/utils';

const googleChromePath = path.join(
  process.env['ProgramFiles(x86)'] || '',
  'Google',
  'Chrome',
  'Application',
  'chrome.exe'
);

export const chromiumExecutable = fs.existsSync(googleChromePath) ? googleChromePath : puppeteer.executablePath();

export default class GUI {
  constructor() {
    this.init();
  }

  async init() {
    const DEBUG_PORT = 9223;

    const chrome_args = `--content-shell-host-window-size=256x414 --no-default-browser-check --no-first-run --remote-debugging-port=${DEBUG_PORT}`;
    executeCommand(
      `"${chromiumExecutable}" --app="http://localhost" --user-data-dir="${path.join(
        process.env.TEMP || __dirname,
        'tempProfile'
      )}" ${chrome_args}`
    )
      .then(() => {
        console.log('Chrome instance closed');
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
    const initPage = pages[0] || (await browser.newPage());
    // initPage.setViewport({
    //   width: 258,
    //   height: 416
    // });
    await initPage.goto(`file://${path.join(__dirname, '..', '..', 'gui', 'index.html')}`);

    await initPage.evaluate(() => {
      const video = document.querySelector<HTMLVideoElement>('#camera-preview')!;
      // const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
      // canvas.width = width;
      // canvas.height = height;
      // const parsedConstraints = JSON.parse(constraints) as MediaStreamConstraints;
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(stream => {
          video.onerror = console.error;
          video.srcObject = stream;
          video.onplay = () => console.log('Video plays!');
          video.play();
          video.volume = 0;
        })
        .catch(error => {
          console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
        });
    });
  }
}
