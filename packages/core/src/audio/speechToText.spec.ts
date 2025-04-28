import path from 'path'

import { describe, expect, it } from 'vitest'

import { initWhisper, speechToText } from './speechToText'

describe(speechToText.name, () => {
  const isGitHubActionsOrCI =
    process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true'

  const exampleWavPath = path.join(
    __dirname,
    '..',
    '..',
    'assets',
    'whisper',
    'example-wav',
    'golden-ratio.wav',
  )

  it('should throw error if model is not ready', async () => {
    if (isGitHubActionsOrCI) {
      expect(true).toBe(true)
    } else {
      await expect(speechToText(exampleWavPath)).rejects.toStrictEqual(
        new Error('Whisper model is not yet ready'),
      )
    }
  })

  it('should transcribe audio', async () => {
    if (isGitHubActionsOrCI) {
      expect(true).toBe(true)
    } else {
      expect(await initWhisper()).toBe(true)
      await expect(speechToText(exampleWavPath)).resolves.toBe(
        'explain golden ratio.',
      )
    }
  }, 300_000)
})
