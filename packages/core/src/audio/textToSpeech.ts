import fs from 'fs'
import path from 'path'

import { wait } from '@aktyn-assistant/common'
//@ts-expect-error no type definitions
import gTTS from 'gtts'
import { v4 as uuidv4 } from 'uuid'

import { logger } from '../utils'

import {
  getAudioOutputDirectory,
  removeOutdatedAudioFiles,
} from './audio-helpers'
import { playAudioFile } from './play'

export async function speak(
  content: string,
  language?: string,
  abortSignal?: AbortSignal,
) {
  content = formatTextForSpeech(content)

  logger.info(`Speaking: ${content}`)

  const audioDir = getAudioOutputDirectory()

  const filePath = path.join(audioDir, `output-${uuidv4()}.mp3`)
  removeOutdatedAudioFiles()

  const res = new gTTS(content, language ?? 'en-us')
  await res.save(filePath)
  await wait(100)

  //TODO: play in queue (add audio file to queue to be played after previous one finishes); abort entire queue
  await playAudioFile(filePath, abortSignal).catch(logger.error)
  fs.unlink(filePath, (error) => {
    if (error) {
      logger.error(error)
    }
  })
}

export function formatTextForSpeech(text: string, lineBreaksToSpaces = false) {
  return text
    .replace(/```([^\n]+)?\n.*\n```/g, 'given code block')
    .replace(/```[\s\S]*?```/g, 'given code block')
    .replace(/\\\[\n.+\n\\\]\n/g, 'given math block\n')
    .split('\n')
    .map((line) => {
      return line
        .replace(/\n/g, ' ')
        .replace(/`.+`/g, 'given code or command')
        .replace(/\\\[.*\\\]/g, 'given math expression')
        .replace(/\\\(.*\\\)/g, 'given math expression')
        .replace(
          /\[(.*)\]\(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)\)/g,
          '$1 link',
        )
        .replace(
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
          'link',
        )
        .replace(/\*\*(.+)\*\*/g, '$1')
        .replace(/^#+\s(.*)$/g, '$1')
        .replace('---', '')
        .replace(/(\d+)\.(\d+)/gi, '$1 coma $2')
    })
    .filter(Boolean)
    .join(lineBreaksToSpaces ? ' ' : '\n')
}
