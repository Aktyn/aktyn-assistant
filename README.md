# Aktyn Assistant

[![Current Version](https://img.shields.io/github/package-json/v/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant)
[![GitHub license](https://img.shields.io/github/license/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Aktyn/DesktopVoiceAssistant.svg)](https://GitHub.com/Aktyn/DesktopVoiceAssistant/issues/)
[![GitHub Stars](https://img.shields.io/github/stars/Aktyn/DesktopVoiceAssistant.svg)](https://github.com/Aktyn/DesktopVoiceAssistant/stargazers)

---

## Overview

Aktyn Assistant is an application that allows you to interact with an AI on various types of devices while performing regular tasks.  
It can be easily activated by a keyboard shortcut.

###### (Coming soon) It is able to take a quick glance at your screen and answer questions about it.<br />It can be easily activated by custom shortcut or voice command.<br />By utilizing different type of AI models, it can perform different tasks like generating images, making real time conversations, understanding image context, etc.

---

## Requirements

Upon first run, you will be prompted to enter your OpenAI API key.  
If you already have an OpenAI account, you can generate an API key [here](https://platform.openai.com/account/api-keys).

---

## Development setup

#### Prerequisites

- **`yarn install`** - yarn 4.2.2 or newer is recommended

#### Terminal app

- **`yarn build:all`** and **`yarn start:terminal`** to run the application with terminal interface
- Some console features doesn't work inside turbo which handles the development run.  
  To make sure the console features work while you develop terminal app you can run **`yarn dev:packages`** to watch changes only in _packages/_ and then **`yarn run build && npx cross-env NODE_ENV=dev yarn start`** from _apps/terminal_ directory

#### Desktop app

- **`yarn build:all`** and **`yarn start:desktop`** to run the application with desktop interface
- **`yarn dev:packages`** to watch changes only in _packages/_ and then **`yarn dev:desktop`**

##### Building desktop app for various platforms

- **`yarn build:all`** and **`yarn start:desktop`** will build project binaries and prepare them for distribution (check _apps/desktop/out_ directory afterwards)

##### Publishing desktop app

- **`yarn build:all`** and **`yarn publish:desktop`** to build and publish the application to github releases

---

## Tools

#### Tools are not part of workspace tree!

##### More info soon

## Future plans

- Speech synthesis and recognition
- Attaching screenshot or selected screen region to active chat with AI
- Real time voice chat utilizing GPT-4o model possibilities
- Support for multiple AI providers
- More integration with system (eg. ability to analyze playing audio and answer questions based on it)
