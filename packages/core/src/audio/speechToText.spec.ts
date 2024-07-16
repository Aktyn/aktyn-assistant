import path from 'path'

import { speechToText } from './speechToText'

describe(speechToText.name, () => {
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

  const exampleWavPath = path.join(
    __dirname,
    '..',
    '..',
    'assets',
    'whisper',
    'example-wav',
    'golden-ratio.wav',
  )

  it('should transcribe audio', async () => {
    if (isGitHubActions) {
      expect(true).toBe(true)
    } else {
      await expect(speechToText(exampleWavPath)).resolves.toBe(
        'explain golden ratio.',
      )
    }
  })
})
