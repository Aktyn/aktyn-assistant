import { assert } from '@aktyn-assistant/common'
import type { OpenAI } from 'openai'

export async function generateImage(
  client: OpenAI,
  { prompt, model }: { prompt: string; model: string },
) {
  assert(
    model === 'dall-e-2' || model === 'dall-e-3' || model === 'gpt-image-1',
    'Unsupported model for image generation',
  )

  const imagesCount = 1

  const image = await client.images.generate({
    model,
    prompt,
    n: imagesCount,
    output_format: 'png',
    size: '1536x1024', //TODO: allow user to choose size depending on model
    quality: 'high', //TODO: allow user to choose hd quality
  })

  assert(image.data?.length === imagesCount, 'Invalid image data')
  return image.data?.[0]?.b64_json
}
