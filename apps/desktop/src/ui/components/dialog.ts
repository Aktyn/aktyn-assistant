import { clsx, createElement } from '../utils/dom'

export class Dialog {
  private readonly container: HTMLDivElement
  private readonly dialog: HTMLDivElement
  private readonly confirmButton: HTMLButtonElement

  constructor(
    title: string | HTMLElement,
    content: string | HTMLElement,
    actions: {
      onClose: (() => void) | null
      onConfirm: (() => void) | null
    },
  ) {
    this.confirmButton = createElement('button', {
      content: 'Confirm',
      postProcess: (button) => {
        button.onclick = () => {
          if (actions.onConfirm) {
            actions.onConfirm()
          }
          actions.onConfirm?.()
        }
      },
    })

    this.dialog = createElement('div', {
      className: 'content-container',
      content: [
        createElement('div', { className: 'dialog-title', content: title }),
        createElement('div', { className: 'dialog-content', content: content }),
        createElement('div', {
          className: clsx('dialog-actions', !actions.onClose && 'single'),
          content: [
            actions.onClose
              ? createElement('button', {
                  content: 'Cancel',
                  postProcess: (button) => {
                    button.onclick = () => {
                      actions.onClose?.()
                    }
                  },
                })
              : null,
            this.confirmButton,
          ],
        }),
      ],
    })

    this.container = createElement('div', {
      className: 'dialog-container',
      content: this.dialog,
    })
  }

  disableConfirmButton() {
    this.confirmButton.disabled = true
  }
  enableConfirmButton() {
    this.confirmButton.disabled = false
  }

  open() {
    document.body.appendChild(this.container)

    anime({
      targets: this.container,
      easing: 'easeInOutSine',
      duration: 800,
      opacity: [0, 1],
    })
    anime({
      targets: this.dialog,
      easing: 'spring(1, 80, 10, 0)',
      translateY: ['-8rem', '0rem'],
      scale: [0.618, 1],
    })
  }
  close() {
    anime({
      targets: this.container,
      easing: 'easeInOutSine',
      duration: 800,
      opacity: 0,
    })
    anime({
      targets: this.dialog,
      easing: 'spring(1, 80, 10, 0)',
      translateY: ['0rem', '-8rem'],
      scale: [1, 0.618],
      complete: () => {
        this.container.remove()
      },
    })
  }
}
