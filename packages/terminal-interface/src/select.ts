import { terminal } from 'terminal-kit'

export function selectAiProvider(items: string[]): Promise<string> {
  if (items.length < 1) {
    return Promise.reject('No items to select')
  }

  if (items.length === 1) {
    return Promise.resolve(items[0])
  }

  terminal.bold('Select AI provider you want to use:\n')

  const { promise } = terminal.singleColumnMenu(items, { continueOnSubmit: false })
  return promise.then((response) => response.selectedText)
}
