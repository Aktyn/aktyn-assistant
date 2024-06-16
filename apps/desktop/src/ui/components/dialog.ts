import { clsx, createElement } from '../domUtils'

export class Dialog {
  public readonly element: HTMLDivElement
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

    const dialog = createElement('div', {
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

    //TODO: entry animation for dialog element

    this.element = createElement('div', {
      className: 'dialog-container',
      content: dialog,
    })
  }

  disableConfirmButton() {
    this.confirmButton.disabled = true
  }
  enableConfirmButton() {
    this.confirmButton.disabled = false
  }

  open() {
    document.body.appendChild(this.element)
  }
  close() {
    this.element.remove()
    //TODO: smooth close animation
  }
}
