import { Switch } from '../components/common/switch'
import { createElement, createMdiIcon } from '../utils/dom'

export class ChatMenu {
  public readonly optionsMenuButton: HTMLButtonElement
  public readonly options: HTMLDivElement

  constructor(
    listeners: {
      onRawResponseToggle: (on: boolean) => void
      onClearChat: () => void
    },
    initialState: {
      showRawResponse: boolean
    },
  ) {
    const toggle = (on: boolean) => {
      if (on) {
        this.options.classList.add('active')
      } else {
        this.options.classList.remove('active')
      }

      anime({
        targets: this.optionsMenuButton,
        easing: 'spring(1, 80, 10, 0)',
        translateX: on ? '4rem' : '0rem',
        opacity: on ? 0 : 1,
      })
      anime({
        targets: this.options,
        easing: 'spring(1, 80, 10, 0)',
        translateX: on ? '0rem' : '-2rem',
        opacity: on ? 1 : 0,
      })
      anime({
        targets: this.options.querySelectorAll(':scope > *'),
        easing: 'spring(1, 80, 10, 0)',
        scale: on ? 1 : 0,
        opacity: on ? 1 : 0,
        delay: anime.stagger(200, { from: 'first' }),
      })
    }

    this.optionsMenuButton = createElement('button', {
      className: 'options-menu-button icon-button',
      content: createMdiIcon('dots-vertical'),
      postProcess: (button) => {
        button.onclick = () => toggle(true)
      },
    })

    const optionsCloseButton = createElement('button', {
      className: 'options-close-button icon-button clean',
      content: createMdiIcon('close'),
      postProcess: (button) => {
        button.onclick = () => toggle(false)
      },
    })

    const rawResponseSwitch = new Switch(
      initialState.showRawResponse,
      listeners.onRawResponseToggle,
    )

    this.options = createElement('div', {
      className: 'options',
      content: [
        createElement('div', {
          className: 'flex',
          content: [
            createElement('span', {
              className: 'switch-label',
              content: 'Show raw response:',
            }),
            rawResponseSwitch.element,
          ],
        }),
        createElement('hr', { className: 'vertical' }),
        createElement('button', {
          content: [
            createMdiIcon('broom'),
            createElement('span', { content: ' Clear chat' }),
          ],
          postProcess: (button) => {
            button.onclick = () => {
              listeners.onClearChat()
            }
          },
        }),
        createElement('hr', { className: 'vertical' }),
        optionsCloseButton,
      ],
      style: { transform: 'translateX(-2rem)' },
    })
  }
}
