import { createElement } from '../utils/dom'

import { fadeIn } from './common'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export function createHeadingElement(level: HeadingLevel, text: string) {
  if (level < 1 || level > 6) {
    console.error('Invalid heading level', level)
    return createElement('span', { content: text })
  }
  const heading = createElement(`h${level}`, {
    content: text.replace(/^#{1,6}\s/m, ''),
  })
  fadeIn(heading)
  return heading
}
