import { terminal } from 'terminal-kit'

export function selectOption(items: string[], title?: string): Promise<string> {
  if (items.length < 1) {
    return Promise.reject('No items to select')
  }

  if (items.length === 1) {
    return Promise.resolve(items[0])
  }

  if (title) {
    terminal.bold(`${title}\n`)
  }

  const { promise } = terminal.singleColumnMenu(items, { continueOnSubmit: false })
  return promise.then((response) => response.selectedText)
}
