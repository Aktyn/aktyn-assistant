import { createElement } from './utils/dom'

export class TitleHeader {
  private readonly header: HTMLHeadingElement

  constructor() {
    const header = document.querySelector<HTMLHeadingElement>('#title-header')
    if (!header) {
      throw new Error('Title header not found in DOM')
    }
    this.header = header

    const words = this.header.innerText.split(/\s/)
    this.header.innerText = ''
    for (const word of words) {
      const span = createElement('span', {
        content: word,
        style: { opacity: '0' },
      })
      this.header.appendChild(span)
    }
  }

  async enter() {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('Timeout')
      }, 8_000)

      anime({
        targets: this.header.childNodes,
        easing: 'easeInOutSine',
        duration: 800,
        delay: anime.stagger(200, { from: 'last' }),
        translateY: [-(this.header.getBoundingClientRect().height ?? 0), 0],
        opacity: 1,
        marginBottom: 0,
        complete: () => {
          clearTimeout(timeout)
          resolve()
        },
      })
    })
  }

  async hide() {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('Timeout')
      }, 8_000)

      const height = this.header.getBoundingClientRect().height ?? 0

      anime({
        targets: this.header.childNodes,
        easing: 'easeInOutCubic',
        duration: 800,
        delay: anime.stagger(200, { from: 'first' }),
        translateY: [0, -height],
        marginBottom: -height,
        complete: () => {
          clearTimeout(timeout)
          resolve()
        },
      })
    })
  }
}
