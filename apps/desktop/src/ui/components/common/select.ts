import { createElement } from '../../utils/dom'

export class Select {
  public readonly element: HTMLSelectElement

  constructor(
    options: string[],
    defaultSelectedOption: string | null,
    private readonly onSelect: (option: string) => void,
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

  public set(value: string, noEmit = false) {
    if (value !== this.element.value) {
      this.element.value = value
    }
    if (!noEmit) {
      this.onSelect(value)
    }
  }
}
