import { createElement } from '../domUtils'

export class Select {
  public readonly element: HTMLSelectElement

  constructor(
    options: string[],
    defaultSelectedOption: string | null,
    onSelect: (option: string) => void,
  ) {
    this.element = createElement('select', {
      content: options.map((option) =>
        createElement('option', { content: option }),
      ),
      postProcess: (element) => {
        //@ts-expect-error it's a hack
        element.onfocus = `this.size=${options.length};`
        //@ts-expect-error it's a hack
        element.onblur = 'this.size=0;'
        //@ts-expect-error it's a hack
        element.onchange = 'this.size=1; this.blur()'
      },
    })
    if (defaultSelectedOption) {
      this.element.value = defaultSelectedOption
    }
    this.element.onchange = (event: Event) =>
      event.target && onSelect((event.target as HTMLSelectElement).value)
  }
}