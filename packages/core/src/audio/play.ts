import { execSync, spawn } from 'child_process'

import { once } from '@aktyn-assistant/common'

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
      console.info('Found media player:', player)
      return player
    } catch {
      continue
    }
  }
  return null
})

export async function playAudioFile(filePath: string) {
  const mediaPlayer = findMediaPlayer()
  if (mediaPlayer) {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now()
      const childProcess = spawn(mediaPlayer, [filePath], { windowsHide: true })
      childProcess.on('error', (error) => {
        console.error(
          'Error while playing audio:',
          error,
          '\n\tFalling back to fallback method',
        )
        playFallback(filePath).then(resolve).catch(reject)
      })
      childProcess.on('exit', (code) => {
        if (code === 0) {
          if (Date.now() - start < 400) {
            console.warn('Media player exited too early. Retrying...')
            playAudioFile(filePath).then(resolve).catch(reject)
          } else {
            resolve()
          }
        } else {
          reject(new Error(`Media player exited with code ${code}`))
        }
      })
    })
  } else {
    return playFallback(filePath)
  }
}

const getAudic = once(() =>
  import('audic').then(({ default: Audic, playAudioFile }) => ({
    Audic,
    playAudioFile,
  })),
)

async function playFallback(filePath: string) {
  console.info('Playing audio with fallback method')
  const { playAudioFile } = await getAudic()
  await playAudioFile(filePath)
}
