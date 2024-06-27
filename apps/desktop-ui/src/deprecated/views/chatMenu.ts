import anime from 'animejs'
import { Switch } from '../components/common/switch'
import { createElement, createMdiIcon } from '../utils/dom'

export class ChatMenu {
  public readonly optionsMenuButton: HTMLButtonElement
  public readonly options: HTMLDivElement

  private synced = false

  constructor(
    listeners: {
      onRawResponseToggle: (on: boolean) => void
      onClearChat: () => void
    },
    private readonly rawResponseSwitch = new Switch(false, (on) => {
      window.electronAPI.setUserConfigValue('showRawResponse', on)
      listeners.onRawResponseToggle(on)
    }),
    private readonly includeHistorySwitch = new Switch(false, (on) => {
      window.electronAPI.setUserConfigValue('includeHistory', on)
    }),
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
        delay: anime.stagger(200, { from: 'center' }),
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
            this.rawResponseSwitch.element,
          ],
        }),
        createElement('hr', { className: 'vertical' }),
        createElement('div', {
          className: 'flex',
          content: [
            createElement('span', {
              className: 'switch-label',
              content: 'Include chat history:',
            }),
            this.includeHistorySwitch.element,
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

    setTimeout(() => {
      if (!this.synced) {
        this.sync().catch(console.error)
      }
    }, 1_000)
  }

  get showRawResponse() {
    return this.rawResponseSwitch.get()
  }
  get includeHistory() {
    return this.includeHistorySwitch.get()
  }

  public async sync() {
    this.rawResponseSwitch.set(
      await window.electronAPI.getUserConfigValue('showRawResponse'),
      true,
    )
    this.includeHistorySwitch.set(
      await window.electronAPI.getUserConfigValue('includeHistory'),
      true,
    )

    this.synced = true
  }
}
