import { createElement } from './dom'

const maxIterations = 1 << 16

function formatMultilineCodeBlocks(
  element: HTMLElement,
  from = 0,
  iteration = 0,
) {
  if (iteration > maxIterations) {
    return
  }

  const content = element.innerHTML

  const codeBlocksMatcher = content.match(/```([^`\n]+)?\n([^`]+)```/)
  if (!codeBlocksMatcher || !codeBlocksMatcher.index) {
    return
  }

  if (codeBlocksMatcher.length < 3) {
    formatMultilineCodeBlocks(
      element,
      from + codeBlocksMatcher.index,
      iteration + 1,
    )
    return
  }

  const language = codeBlocksMatcher[1] as string | undefined
  const code = codeBlocksMatcher[2]

  replaceInElement(
    element,
    codeBlocksMatcher.index,
    codeBlocksMatcher.index + codeBlocksMatcher[0].length,
    createCodeBlockElement(language, code),
  )
  formatMultilineCodeBlocks(element, from, iteration + 1)
}

function formatSinglelineCodeBlocks(
  element: HTMLElement,
  from = 0,
  iteration = 0,
) {
  if (iteration > maxIterations) {
    return
  }

  const content = element.innerHTML

  const singleLineBlockMatcher = content.match(/`([^`]+)`/)
  if (!singleLineBlockMatcher || !singleLineBlockMatcher.index) {
    return
  }

  if (singleLineBlockMatcher.length < 2) {
    formatSinglelineCodeBlocks(
      element,
      from + singleLineBlockMatcher.index,
      iteration + 1,
    )
    return
  }

  replaceInElement(
    element,
    singleLineBlockMatcher.index,
    singleLineBlockMatcher.index + singleLineBlockMatcher[0].length,
    createElement('pre', {
      className: 'code-block-inline',
      content: singleLineBlockMatcher[1],
    }),
  )
  formatSinglelineCodeBlocks(element, from, iteration + 1)
}

export function formatCodeBlocks(element: HTMLElement) {
  formatMultilineCodeBlocks(element)
  formatSinglelineCodeBlocks(element)
}

function replaceInElement(
  element: HTMLElement,
  start: number,
  end: number,
  node: Node,
) {
  const content = element.innerHTML

  const splitContentStart = content.substring(0, start)
  const splitContentEnd = content.substring(end)

  element.innerHTML = splitContentStart
  element.appendChild(node)
  element.append(splitContentEnd)
}

/** @see https://prismjs.com/download.html for more customization options */
function createCodeBlockElement(language: string | undefined, code: string) {
  return createElement('pre', {
    className: 'code-block',
    content: createElement('code', {
      className: `language-${language ?? 'plaintext'}`,
      postProcess: (element) => {
        const tokenizedHTML = window.Prism.highlight(
          code,
          window.Prism.languages[language ?? 'plaintext'],
          language ?? 'plaintext',
        )
        element.innerHTML = tokenizedHTML
      },
    }),
  })
}
