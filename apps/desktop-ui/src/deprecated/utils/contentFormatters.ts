import anime from 'animejs'
import { Notifications } from '../components/common/notifications'

import { createElement, createMdiIcon } from './dom'
import { highlightAllUnder } from 'prismjs'
import { Converter } from 'showdown'

export function format(
  converter: Converter,
  element: HTMLElement,
  rawContent: string,
) {
  const html = converter.makeHtml(rawContent)
  element.innerHTML = html
  highlightAllUnder(element, false)
  element.querySelectorAll('pre').forEach((pre) => {
    const header = createCodeBlockHeaderElement(pre)
    if (header) {
      pre.prepend(header)
    }
  })
}

function createCodeBlockHeaderElement(pre: HTMLPreElement) {
  const language = pre.className.replace(/^language-/, '')
  const codeElement = pre.querySelector('code')

  if (!codeElement) {
    return null
  }

  const code = codeElement.textContent ?? ''
  const chevronIcon = createMdiIcon('chevron-up')
  const toggleSpan = createElement('span', { content: ' Hide' })
  let codeHeight = 0

  return createElement('div', {
    className: 'code-block-header',
    content: [
      createElement('div', {
        className: 'language',
        content: language ?? 'Plain text',
      }),
      createElement('div', {
        className: 'code-options',
        content: [
          createElement('button', {
            content: [
              createMdiIcon('content-copy'),
              createElement('span', { content: ' Copy' }),
            ],
            postProcess: (button) => {
              button.onclick = () => {
                navigator.clipboard.writeText(code).catch(console.error)
                Notifications.provider.showNotification(
                  Notifications.type.INFO,
                  {
                    message: 'Copied to clipboard',
                  },
                )
              }
            },
          }),
          createElement('button', {
            content: [chevronIcon, toggleSpan],
            postProcess: (button) => {
              button.onclick = () => {
                codeElement.classList.toggle('hidden')
                chevronIcon.classList.toggle('mdi-flip-v')

                const hidden = codeElement.classList.contains('hidden')
                if (hidden) {
                  toggleSpan.innerText = ' Show'
                } else {
                  toggleSpan.innerText = ' Hide'
                }

                codeHeight = Math.max(
                  codeHeight,
                  codeElement.getBoundingClientRect().height,
                )
                const range = [codeHeight, 0]
                anime({
                  targets: codeElement,
                  easing: 'easeInOutCirc',
                  duration: 200,
                  maxHeight: hidden ? range : range.toReversed(),
                  opacity: hidden ? 0 : 1,
                })
              }
            },
          }),
        ],
      }),
    ],
  })
}
