import { Notifications } from '../components/notifications'

import { createElement, createMdiIcon } from './dom'

type CodeBlockInfo = { start: number; end: number } & (
  | {
      inline: true
    }
  | {
      inline: false
      language?: string
    }
)

export function formatCodeBlocks(element: HTMLElement) {
  const text = element.innerText
  const foundBlocks: CodeBlockInfo[] = []

  let inlinePivot = 0
  while (inlinePivot < text.length) {
    const inlineMatch = text.substring(inlinePivot).match(/`([^`\n]+)`/)
    if (!inlineMatch || !inlineMatch.index) {
      break
    }

    if (inlineMatch.length >= 2) {
      const inlineStart = inlinePivot + inlineMatch.index
      const inlineEnd = inlineStart + inlineMatch[0].length
      foundBlocks.push({
        start: inlineStart,
        end: inlineEnd,
        inline: true,
      })
    }

    inlinePivot += Math.max(1, inlineMatch.index + inlineMatch[0].length)
  }

  let multilinePivot = 0
  while (multilinePivot < text.length) {
    const multilineMatch = text
      .substring(multilinePivot)
      .match(/```([^`\n]+)?\n([^`]+)```/)
    if (!multilineMatch || !multilineMatch.index) {
      break
    }

    if (multilineMatch.length >= 3) {
      const multilineStart = multilinePivot + multilineMatch.index
      const multilineEnd = multilineStart + multilineMatch[0].length
      foundBlocks.push({
        start: multilineStart,
        end: multilineEnd,
        inline: false,
        language: multilineMatch[1] as string | undefined,
      })
    }

    multilinePivot += Math.max(
      1,
      multilineMatch.index + multilineMatch[0].length,
    )
  }

  replaceElementWithCodeBlocks(element, foundBlocks)
}

function replaceElementWithCodeBlocks(
  element: HTMLElement,
  blocks: CodeBlockInfo[],
) {
  blocks.sort((a, b) => a.start - b.start)

  const content = element.innerText
  const nodes: Node[] = []

  let pivot = 0
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (i < blocks.length - 1 && block.end > blocks[i + 1].start) {
      console.warn('Found overlapping code blocks', block, blocks[i + 1])
      continue
    }

    const contentLeft = content.substring(pivot, block.start)
    const blockContent = content.substring(block.start, block.end)
    if (contentLeft.length) {
      nodes.push(createElement('span', { content: contentLeft }))
    }
    if (block.inline) {
      nodes.push(
        createElement('pre', {
          className: 'code-block-inline',
          content: trimBackticks(blockContent),
        }),
      )
    } else {
      nodes.push(
        createCodeBlockElement(
          block.language,
          trimBackticks(blockContent).replace(
            new RegExp(`^${block.language ?? ''}\n?`, 'i'),
            '',
          ),
        ),
      )
    }
    pivot = block.end
  }
  const contentRight = content.substring(pivot)
  if (contentRight.length) {
    nodes.push(createElement('span', { content: contentRight }))
  }

  element.replaceWith(...nodes)
}

/** @see https://prismjs.com/download.html for more customization options */
function createCodeBlockElement(language: string | undefined, code: string) {
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

  return createElement('pre', {
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
}

function trimBackticks(text: string) {
  return text.replace(/^`+\n?/, '').replace(/\n?`+$/, '')
}
