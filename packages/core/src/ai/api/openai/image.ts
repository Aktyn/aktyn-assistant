import { assert } from '@aktyn-assistant/common'
import type { OpenAI } from 'openai'

export async function generateImage(
  client: OpenAI,
  { prompt, model }: { prompt: string; model: string },
) {
  assert(
    model === 'dall-e-2' || model === 'dall-e-3',
    'Unsupported model for image generation',
  )

  const imagesCount = 1

  const image = await client.images.generate({
    model,
    prompt,
    n: imagesCount,
    quality: 'standard', //TODO: allow user to choose hd quality for dall-e-3,
    response_format: 'b64_json',
    size: '1024x1024', //TODO: allow user to choose size depending on model
    // style: 'vivid' //TODO: allow user to choose style for dall-e-3
  })

  assert(image.data.length === imagesCount, 'Invalid image data')
  return image.data[0].b64_json
}
