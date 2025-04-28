import { toast } from 'sonner'
import type { Converter } from 'showdown'

export function format(
  converter: Converter,
  element: HTMLElement,
  rawContent: string,
) {
  const html = converter.makeHtml(rawContent)
  element.innerHTML = html
  try {
    window.Prism.highlightAllUnder(element, false)
  } catch (e) {
    console.error(e)
  }
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
  const chevronIcon = document.createElement('span')
  chevronIcon.className = 'mdi mdi-chevron-up'
  const toggleSpan = document.createElement('span')
  toggleSpan.innerText = ' Hide'
  let codeHeight = 0

  const headerDiv = document.createElement('div')
  headerDiv.className = 'code-block-header'

  const languageDiv = document.createElement('div')
  languageDiv.className = 'language'
  languageDiv.textContent = language || 'Plain text'
  headerDiv.appendChild(languageDiv)

  const codeOptionsDiv = document.createElement('div')
  codeOptionsDiv.className = 'code-options'
  headerDiv.appendChild(codeOptionsDiv)

  const copyButton = document.createElement('button')

  const copyIcon = document.createElement('span')
  copyIcon.className = 'mdi mdi-content-copy'
  copyButton.appendChild(copyIcon)

  const copyText = document.createElement('span')
  copyText.textContent = ' Copy'
  copyButton.appendChild(copyText)

  copyButton.onclick = () => {
    navigator.clipboard.writeText(code).catch(console.error)
    toast.success('Copied to clipboard')
  }
  codeOptionsDiv.appendChild(copyButton)

  const toggleButton = document.createElement('button')
  toggleButton.appendChild(chevronIcon)
  toggleButton.appendChild(toggleSpan)

  toggleButton.onclick = () => {
    codeElement.classList.toggle('hidden')
    chevronIcon.classList.toggle('mdi-flip-v')

    const hidden = codeElement.classList.contains('hidden')
    toggleSpan.innerText = hidden ? ' Show' : ' Hide'

    codeHeight = Math.max(
      codeHeight,
      codeElement.getBoundingClientRect().height,
    )
    //TODO: Add animation
    // const range = [codeHeight, 0]
    // anime({
    //   targets: codeElement,
    //   easing: 'easeInOutCirc',
    //   duration: 200,
    //   maxHeight: hidden ? range : range.reverse(),
    //   opacity: hidden ? 0 : 1,
    // })
  }

  codeOptionsDiv.appendChild(toggleButton)

  return headerDiv
}
