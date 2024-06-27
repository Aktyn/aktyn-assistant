import { createElement, createMdiIcon } from '../../utils/dom'

export class Switch {
  public readonly element: HTMLDivElement
  private on = false

  constructor(
    defaultOn: boolean,
    private readonly onToggle: (on: boolean) => void,
  ) {
    this.on = defaultOn

    this.element = createElement('div', {
      className: 'switch',
      content: createElement('span', { content: createMdiIcon('check') }),
    })
    this.element.onclick = () => this.toggle()

    if (defaultOn) {
      this.element.classList.add('active')
    }
  }

  private toggle(noEmit = false) {
    if (this.on) {
      this.on = false
      this.element.classList.remove('active')
      if (!noEmit) {
        this.onToggle(false)
      }
    } else {
      this.on = true
      this.element.classList.add('active')
      if (!noEmit) {
        this.onToggle(true)
      }
    }
  }

  public get() {
    return this.on
  }

  public set(on: boolean, noEmit = false) {
    if (on !== this.on) {
      this.toggle(noEmit)
    }
  }
}
