import path from 'path'

import { speechToText } from './speechToText'

describe(speechToText.name, () => {
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
    await expect(speechToText(exampleWavPath)).resolves.toBe(
      'explain golden ratio.',
    )
  })
})
