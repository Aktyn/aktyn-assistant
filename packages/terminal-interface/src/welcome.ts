import { terminal } from 'terminal-kit'

import { printCentered } from './common'

export function showWelcomeMessage() {
  terminal.windowTitle('Aktyn Assistant')
  terminal.clear()

  const requiredWidth = productNameAsciiArt.reduce(
    (acc, line) => Math.max(acc, Math.max(...line.split('\n').map((c) => c.length))),
    0,
  )

  if (terminal.width < requiredWidth) {
    terminal.bold('Aktyn Assistant\n')
    return
  }

  for (const word of productNameAsciiArt) {
    printCentered(word)
    terminal('\n\n')
  }
}

//TODO: variants for smaller console width
const productNameAsciiArt = [
  `
 █████  ██   ██ ████████ ██    ██ ███    ██
██   ██ ██  ██     ██     ██  ██  ████   ██
███████ █████      ██      ████   ██ ██  ██
██   ██ ██  ██     ██       ██    ██  ██ ██
██   ██ ██   ██    ██       ██    ██   ████
`,
  `
 █████  ███████ ███████ ██ ███████ ████████  █████  ███    ██ ████████
██   ██ ██      ██      ██ ██         ██    ██   ██ ████   ██    ██   
███████ ███████ ███████ ██ ███████    ██    ███████ ██ ██  ██    ██   
██   ██      ██      ██ ██      ██    ██    ██   ██ ██  ██ ██    ██   
██   ██ ███████ ███████ ██ ███████    ██    ██   ██ ██   ████    ██   
`,
]
