import { Notifications } from '../components/notifications'
import { createElement, createMdiIcon } from '../utils/dom'

import { fadeIn, trimSymbol } from './common'

export function createInlineCodeBlockElement(codeContent: string) {
  const block = createElement('pre', {
    className: 'code-block-inline',
    content: trimSymbol(codeContent, '`'),
  })

  fadeIn(block)
  return block
}

/** @see https://prismjs.com/download.html for more customization options */
export function createCodeBlockElement(
  language: string | undefined,
  codeContent: string,
) {
  const code = trimSymbol(codeContent, '`').replace(
    new RegExp(`^${language ?? ''}\n?`, 'i'),
    '',
  )

  const codeElement = createElement('code', {
    className: `language-${language ?? 'plaintext'}`,
    postProcess: (element) => {
      element.innerHTML = window.Prism.highlight(
        code,
        window.Prism.languages[language ?? 'plaintext'],
        language ?? 'plaintext',
      )
    },
  })
  const chevronIcon = createMdiIcon('chevron-up')
  const toggleSpan = createElement('span', { content: ' Hide' })
  let codeHeight = 0

  const block = createElement('pre', {
    className: 'code-block',
    content: [
      createElement('div', {
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
      }),
      codeElement,
    ],
  })

  anime({
    targets: block,
    easing: 'spring(1, 80, 10, 0)',
    opacity: [0, 1],
    translateX: ['4rem', '0rem'],
  })

  return block
}
