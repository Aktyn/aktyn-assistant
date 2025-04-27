import { execSync, spawn } from 'child_process'
import fs from 'fs'

import { once, wait } from '@aktyn-assistant/common'

import { logger } from '../utils'

//TODO: support for other players and operating systems
const potentialPlayers = [
  'mplayer',
  'afplay',
  'mpg123',
  'mpg321',
  'play',
  'omxplayer',
  'aplay',
  'cmdmp3',
]

const findMediaPlayer = once(() => {
  for (const player of potentialPlayers) {
    try {
      execSync(player)
      logger.info(`Found media player: ${player}`)
      return player
    } catch {
      continue
    }
  }
  return null
})

type PlayOptions = {
  abortSignal?: AbortSignal
  removeAfterPlaying?: boolean
}

async function playAudioFile(
  filePath: string,
  abortSignal?: AbortSignal,
  attempt = 0,
) {
  const mediaPlayer = findMediaPlayer()
  if (mediaPlayer) {
    return new Promise<void>((resolve, reject) => {
      if (abortSignal?.aborted) {
        return resolve()
      }

      const start = Date.now()
      const childProcess = spawn(mediaPlayer, [filePath], { windowsHide: true })

      childProcess.on('error', (error) => {
        logger.error(
          'Error while playing audio:',
          error,
          '\n\tFalling back to fallback method',
        )
        playFallback(filePath).then(resolve).catch(reject)
      })
      childProcess.on('exit', (code) => {
        if (code === 0) {
          if (Date.now() - start < 400 && attempt < 64) {
            logger.warn('Media player exited too early. Retrying...')
            playAudioFile(filePath, abortSignal, attempt + 1)
              .then(resolve)
              .catch(reject)
          } else {
            resolve()
          }
        } else {
          reject(new Error(`Media player exited with code ${code}`))
        }
      })

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          childProcess.kill()
          resolve()
        })
      }
    })
  } else {
    if (abortSignal?.aborted) {
      return
    }
    return await playFallback(filePath)
  }
}

const playingQueue: Array<string> = []
let queuePromise: Promise<void> | null = null

function playNextInQueue(options: PlayOptions = {}) {
  const filePath = playingQueue.shift()
  if (!filePath) {
    return null
  }

  return new Promise<void>((resolve, reject) => {
    logger.info(`Playing audio file: ${filePath}`)
    playAudioFile(filePath, options.abortSignal)
      .catch(reject)
      .finally(() => {
        resolve()

        if (options.removeAfterPlaying) {
          try {
            fs.unlink(filePath, (error) => {
              if (error) {
                logger.error(error)
              }
            })
          } catch (error) {
            logger.error(error)
          }
        }
      })
  })
}

export async function queueAudioFile(
  filePath: string,
  options: PlayOptions = {},
) {
  logger.info(`Queuing audio file: ${filePath}`)
  playingQueue.push(filePath)

  if (queuePromise) {
    while (queuePromise) {
      await wait(100)
    }
    return
  }

  queuePromise = playNextInQueue(options)
  while (queuePromise) {
    try {
      await queuePromise
    } catch (error) {
      logger.error(error)
    }
    queuePromise = playNextInQueue(options)
  }
}

const getAudic = once(() =>
  import('audic').then(({ default: Audic, playAudioFile }) => ({
    Audic,
    playAudioFile,
  })),
)

async function playFallback(filePath: string) {
  try {
    logger.info('Playing audio with fallback method')
    const { playAudioFile: playAudic } = await getAudic()
    await playAudic(filePath)
  } catch (error) {
    logger.error(error, 'Error while playing audio with fallback method')
  }
}
