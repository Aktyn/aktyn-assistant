import { createElement } from './utils/dom'
import { ChatView } from './views/chat'
import { InfoView } from './views/info'
import { SettingsView } from './views/settings'
import { type ViewBase } from './views/viewBase'

export enum ViewType {
  Chat = 'chat',
  Settings = 'settings',
  Info = 'info',
}

const viewsProperties: {
  [key in ViewType]: { title: string; icon: string; createView: () => ViewBase }
} = {
  [ViewType.Chat]: {
    title: 'Chat',
    icon: 'chat',
    createView: () => new ChatView(),
  },
  [ViewType.Settings]: {
    title: 'Settings',
    icon: 'cog',
    createView: () => new SettingsView(),
  },
  [ViewType.Info]: {
    title: 'Info',
    icon: 'information-box',
    createView: () => new InfoView(),
  },
}

class ViewItem {
  public readonly handleElement: HTMLDivElement
  public readonly contentContainer: HTMLDivElement
  public readonly view: ViewBase

  constructor(public readonly viewType: ViewType) {
    const { title, icon, createView } = viewsProperties[viewType]
    const iconElement = createElement('span', { className: `mdi mdi-${icon}` })
    const textElement = createElement('div', { content: title })

    this.handleElement = createElement('div', {
      className: `view-item ${this.viewType}`,
    })
    this.handleElement.appendChild(iconElement)
    this.handleElement.appendChild(textElement)

    this.view = createView()
    this.contentContainer = createElement('div', {
      className: 'view-content-container',
      content: this.view.content,
    })
  }
}

export class Menu {
  private readonly menuContainer: HTMLDivElement
  private readonly viewsContainer: HTMLDivElement
  private readonly viewItems = Object.values(ViewType).map(
    (viewType) => new ViewItem(viewType),
  )

  private view: ViewType | null = null

  constructor(
    private readonly listeners: {
      onViewEnter: () => void
      onViewHide: () => void
    },
  ) {
    const main = document.querySelector<HTMLDivElement>('main')
    if (!main) {
      throw new Error('Main element not found in DOM')
    }

    this.menuContainer = createElement('div', { className: 'menu-container' })
    main.appendChild(this.menuContainer)

    this.viewsContainer = createElement('div', { className: 'views-container' })
    main.appendChild(this.viewsContainer)

    for (const viewItem of this.viewItems) {
      this.menuContainer.appendChild(viewItem.handleElement)

      viewItem.handleElement.onclick = () => {
        if (this.view === viewItem.viewType) {
          return
        }
        this.enterView(viewItem.viewType)
      }
    }
  }

  public enterView(viewType: ViewType) {
    this.view = viewType

    for (const viewItem of this.viewItems) {
      if (viewItem.viewType === this.view) {
        viewItem.handleElement.classList.add('active')
      } else {
        viewItem.handleElement.classList.remove('active')
      }
    }

    this.focusView(viewType, 'smooth')

    if (this.menuContainer.classList.contains('active')) {
      return
    }

    this.menuContainer.classList.add('active')

    if (this.menuContainer.style.position !== 'fixed') {
      const box = this.menuContainer.getBoundingClientRect()
      this.menuContainer.style.top = `${box.top}px`
      this.menuContainer.style.width = `${box.width}px`

      setTimeout(() => {
        this.menuContainer.style.position = 'fixed'
        this.menuContainer.style.marginInline = 'auto'
      }, 1)
    }

    if (this.menuContainer.style.top !== '0px') {
      anime({
        targets: this.menuContainer,
        easing: 'easeInOutSine',
        top: '0px',
        delay: anime.stagger(200, { from: 'center' }),
        complete: () => {
          this.initViews(viewType)
        },
      })
    }

    this.listeners.onViewEnter()
  }

  private initViews(focusView: ViewType) {
    this.viewsContainer.style.paddingTop =
      this.menuContainer.getBoundingClientRect().height + 'px'
    this.viewsContainer.style.opacity = '0'

    anime({
      targets: this.viewsContainer,
      easing: 'easeInOutCirc',
      duration: 800,
      opacity: 1,
    })

    for (const viewItem of this.viewItems) {
      this.viewsContainer.appendChild(viewItem.contentContainer)
    }
    this.focusView(focusView)
  }

  private focusView(viewType: ViewType, behavior: ScrollBehavior = 'instant') {
    const viewItem = this.viewItems.find((item) => item.viewType === viewType)
    if (!viewItem) {
      return
    }

    viewItem.contentContainer.scrollIntoView({
      inline: 'center',
      behavior,
    })
    viewItem.view.onOpen()

    for (const otherView of this.viewItems) {
      if (otherView.viewType === viewType) {
        continue
      }
      otherView.view.onClose()
    }
  }

  async init(
    initData: Awaited<ReturnType<typeof window.electronAPI.getInitData>>,
  ) {
    for (const item of this.viewItems) {
      item.view.onExternalData(initData)
    }

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
