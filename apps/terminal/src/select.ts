import { terminal } from 'terminal-kit'
import type { SingleColumnMenuOptions, SingleLineMenuResponse } from 'terminal-kit/Terminal'

export function selectOption(
  items: string[],
  title?: string,
  orientation: 'vertical' | 'horizontal' = 'vertical',
  autoSelectIndex?: number,
): Promise<string> {
  if (items.length < 1) {
    return Promise.reject('No items to select')
  }

  if (items.length === 1) {
    return Promise.resolve(items[0])
  }

  if (title) {
    terminal.bold(`${title}\n`)
  }

  const commonOptions = {
    cancelable: false,
    exitOnUnexpectedKey: false,
    selectedIndex: autoSelectIndex,
  } satisfies Partial<SingleColumnMenuOptions & SingleLineMenuResponse>

  const { promise } =
    orientation === 'vertical'
      ? terminal.singleColumnMenu(items, {
          ...commonOptions,
          continueOnSubmit: false,
        })
      : terminal.singleLineMenu(items, {
          ...commonOptions,
          separator: ' | ',
        })
  return promise.then((response) => response.selectedText)
}

export function selectYesOrNo(title?: string): Promise<boolean> {
  return selectOption([' Yes ', ' No '], title, 'horizontal').then(
    (response) => response === ' Yes ',
  )
}
