import { clsx, createElement } from '../domUtils'

enum NotificationsType {
  Error = 'error',
}

type NotificationSchema = {
  title?: string
  message: string
  duration?: number
}

export class Notifications {
  public static type = NotificationsType
  private static instance: Notifications | null = null

  private readonly container: HTMLDivElement

  private constructor() {
    if (Notifications.instance) {
      throw new Error('Notifications already initialized')
    }
    this.container = createElement('div', {
      className: 'notifications-container',
    })
    document.body.appendChild(this.container)
  }

  public static get provider() {
    if (!Notifications.instance) {
      Notifications.instance = new Notifications()
    }
    return Notifications.instance
  }

  showNotification(type: NotificationsType, schema: NotificationSchema) {
    //TODO: queue notifications to prevent overflowing the screen

    const notification = createElement('div', {
      className: clsx('notification', type),
      content: [
        schema.title ? createElement('strong', { content: schema.title }) : null,
        createElement('div', { content: schema.message }),
      ],
    })
    this.container.appendChild(notification)

    anime({
      targets: notification,
      easing: 'spring(1, 80, 10, 0)',
      opacity: [0, 1],
      translateY: ['-4rem', '0rem'],
    })

    const duration = schema.duration ?? 5000
    if (duration > 100) {
      setTimeout(() => {
        anime({
          targets: notification,
          easing: 'spring(1, 80, 10, 0)',
          opacity: 0,
          translateY: ['0rem', '4rem'],
          //TODO: animate bottom margin to prevent other notifications from jumping when this notification is removed
          complete: () => {
            notification.remove()
          },
        })
      }, duration)
    }
  }
}
