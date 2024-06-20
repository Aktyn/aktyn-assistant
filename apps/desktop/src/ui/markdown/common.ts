export function trimSymbol(text: string, symbol: string) {
  // return text.replace(/^`+\n?/, '').replace(/\n?`+$/, '')
  return text
    .replace(new RegExp(`^${symbol}+\\n?`), '')
    .replace(new RegExp(`\\n?${symbol}+$`), '')
}

export function fadeIn(element: HTMLElement) {
  anime({
    targets: element,
    easing: 'easeInOutSine',
    duration: 400,
    opacity: [0, 1],
  })
}
