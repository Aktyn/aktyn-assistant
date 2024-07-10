import fs from 'fs'

import type { OpenAI } from 'openai'

export async function transcribeSpeech(client: OpenAI, filePath: string) {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath), //TODO: try skip creating file step and use stream directly
    model: 'whisper-1', //* No other models support speech to text yet
  })

  return transcription.text
}
