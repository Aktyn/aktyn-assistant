import { createElement } from './domUtils'

enum ViewType {
  Chat = 'chat',
  Settings = 'settings',
  Info = 'info',
}

const viewsProperties: { [key in ViewType]: { title: string; icon: string } } = {
  [ViewType.Chat]: {
    title: 'Chat',
    icon: 'chat',
  },
  [ViewType.Settings]: {
    title: 'Settings',
    icon: 'cog',
  },
  [ViewType.Info]: {
    title: 'Info',
    icon: 'information-box',
  },
}

class ViewItem {
  public readonly handleElement: HTMLDivElement

  constructor(public readonly viewType: ViewType) {
    const { title, icon } = viewsProperties[viewType]
    const iconElement = createElement('span', { className: `mdi mdi-${icon}` })
    const textElement = createElement('div', { content: title })

    this.handleElement = createElement('div', {
      className: `view-item ${this.viewType}`,
    })
    this.handleElement.appendChild(iconElement)
    this.handleElement.appendChild(textElement)
  }

  activate() {
    this.handleElement.classList.add('active')

    //TODO: smoothly move to top and show exit button
    // const box = this.handleElement.getBoundingClientRect()
    // this.handleElement.style.position = 'fixed'
    // this.handleElement.style.top = `${box.top}px`
    // this.handleElement.style.left = `${box.left}px`
  }

  deactivate() {
    this.handleElement.classList.remove('active')
    this.handleElement.classList.add('disabled')

    anime({
      targets: this.handleElement,
      easing: 'easeInOutCubic',
      opacity: 0,
      scale: 0.618,
    })
  }
}

export class Menu {
  private readonly menuContainer: HTMLDivElement
  private readonly viewItems = Object.values(ViewType).map((viewType) => new ViewItem(viewType))

  private view: ViewType | null = null

  constructor(private readonly listeners: { onViewEnter: () => void; onViewHide: () => void }) {
    const main = document.querySelector<HTMLDivElement>('main')
    if (!main) {
      throw new Error('Main element not found in DOM')
    }

    this.menuContainer = createElement('div', { className: 'menu-container' })
    main.appendChild(this.menuContainer)

    for (const viewItem of this.viewItems) {
      this.menuContainer.appendChild(viewItem.handleElement)

      viewItem.handleElement.onclick = () => {
        if (this.view) {
          return
        }
        this.view = viewItem.viewType
        viewItem.activate()
        for (const otherViewItem of this.viewItems) {
          if (otherViewItem.viewType !== this.view) {
            otherViewItem.deactivate()
          }
        }
        this.listeners.onViewEnter()
      }
    }
  }

  async init() {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('Timeout')
      }, 8_000)

      anime({
        targets: this.viewItems.map((viewItem) => viewItem.handleElement),
        easing: 'spring(1, 80, 10, 0)',
        opacity: [0, 1],
        scale: [0.618, 1],
        translateY: ['-8rem', '0rem'],
        delay: anime.stagger(200, { from: 'center' }),
        complete: () => {
          clearTimeout(timeout)
          resolve()
        },
      })
    })
  }
}

// export async function initMenu() {
//   return new Promise<void>((resolve, reject) => {
//     const timeout = setTimeout(() => {
//       reject('Timeout')
//     }, 8_000)

//     const main = document.querySelector<HTMLDivElement>('main')

//     if (!main) {
//       clearTimeout(timeout)
//       reject('Main element not found')
//       return
//     }

//     const menuContainer = createElement('div', { className: 'menu-container' })
//     main.appendChild(menuContainer)

//     const viewItems = Object.values(ViewType).map((viewType) => new ViewItem(viewType))
//     for (let i = 0; i < viewItems.length; i++) {
//       const angleStart = Math.PI * 2 * ((i - 0.5) / viewItems.length + 0.25)
//       const angleEnd = Math.PI * 2 * ((i + 0.5) / viewItems.length + 0.25)

//       const outerRadiusFactor = Math.sqrt(viewItems.length + 1)
//       const xStart = ((Math.cos(angleStart) * outerRadiusFactor + 1) / 2) * 100
//       const yStart = ((Math.sin(angleStart) * outerRadiusFactor + 1) / 2) * 100
//       const xEnd = ((Math.cos(angleEnd) * outerRadiusFactor + 1) / 2) * 100
//       const yEnd = ((Math.sin(angleEnd) * outerRadiusFactor + 1) / 2) * 100

//       viewItems[i].handleElement.style.clipPath =
//         `polygon(50% 50%, ${xStart}% ${yStart}%, ${xEnd}% ${yEnd}%)`

//       menuContainer.appendChild(viewItems[i].handleElement)
//     }

//     const radiusRem = 6

//     anime({
//       targets: menuContainer,
//       easing: 'spring(1, 80, 10, 0)',
//       rotate: [45, 0],
//     })

//     anime({
//       targets: viewItems.map((viewItem) => viewItem.element),
//       easing: 'spring(1, 80, 10, 0)',
//       opacity: [0, 1],
//       scale: [0.618, 1],
//       translateX: (_: HTMLElement, index: number) => {
//         return `${Math.cos(Math.PI * 2 * (index / viewItems.length + 0.25)) * radiusRem}rem`
//       },
//       translateY: (_: HTMLElement, index: number) => {
//         return `${Math.sin(Math.PI * 2 * (index / viewItems.length + 0.25)) * radiusRem}rem`
//       },
//       rotate: [-45, 0],
//       complete: () => {
//         clearTimeout(timeout)
//         resolve()
//       },
//     })
//   })
// }
