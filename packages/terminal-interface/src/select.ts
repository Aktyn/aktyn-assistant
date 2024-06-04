import { terminal } from 'terminal-kit'

export function selectAiProvider(items: string[]): Promise<string> {
  terminal.bold('Select AI provider you want to use:')

  return new Promise((resolve, reject) => {
    terminal.singleColumnMenu(items, function (error, response) {
      if (error) {
        reject(error)
        return
      }

      resolve(response.selectedText)
    })
  })
}
