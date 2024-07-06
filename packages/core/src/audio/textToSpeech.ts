import fs from 'fs'
import path from 'path'

import { once, wait } from '@aktyn-assistant/common'
//@ts-expect-error no type definitions
import gTTS from 'gtts'
import { v4 as uuidv4 } from 'uuid'

import { getDataDirectory } from '../utils'

import { playAudioFile } from './play'

const getAudioOutputDirectory = once(() => {
  const audioDir = path.join(getDataDirectory(), 'audio')
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true })
  }
  return audioDir
})

export async function speak(content: string, abortSignal?: AbortSignal) {
  content = formatTextForSpeech(content)

  console.info('Speaking:', content)

  const audioDir = getAudioOutputDirectory()

  const filePath = path.join(audioDir, `output-${uuidv4()}.mp3`)

  const res = new gTTS(content, 'en-us')
  await res.save(filePath)
  await wait(100)

  await playAudioFile(filePath, abortSignal).catch(console.error)
  fs.unlink(filePath, (error) => {
    if (error) {
      console.error(error)
    }
  })
  removeOutdatedAudioFiles()
}

function removeOutdatedAudioFiles() {
  try {
    const audioDir = getAudioOutputDirectory()

    const now = Date.now()
    const hour = 1000 * 60 * 60
    for (const file of fs.readdirSync(audioDir)) {
      const filePath = path.join(audioDir, file)
      if (fs.statSync(filePath).mtime.getTime() < now - hour) {
        fs.unlinkSync(filePath)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

export function formatTextForSpeech(text: string) {
  return text
    .replace(/```([^\n]+)?\n.*\n```/g, 'given code block')
    .replace(/```[\s\S]*?```/g, 'given code block')
    .split('\n')
    .map((line) => {
      return line
        .replace(/\n/g, ' ')
        .replace(/`.+`/g, 'given code or command')
        .replace(/\\\[.*\\\]/g, 'given math expression')
        .replace(/\\\(.*\\\)/g, 'given math expression')
        .replace(/\*\*(.+)\*\*/g, '$1')
        .replace(/^#+\s(.*)$/g, '$1')
        .replace('---', '')
    })
    .filter(Boolean)
    .join(' ')
}
