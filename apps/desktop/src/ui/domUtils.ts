type Props<TagName extends keyof HTMLElementTagNameMap> = {
  className?: string
  content?: string | HTMLElement | (HTMLElement | null | undefined)[]
  style?: Partial<CSSStyleDeclaration>
  postProcess?: (element: HTMLElementTagNameMap[TagName]) => void
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
  props: Props<TagName> = {},
): HTMLElementTagNameMap[TagName] {
  const element = document.createElement(tagName)
  if (props.className) {
    element.className = props.className
  }

  if (props.style) {
    Object.assign(element.style, props.style)
  }

  if (typeof props.content === 'string') {
    element.innerText = props.content
  }
  if (props.content instanceof HTMLElement) {
    element.appendChild(props.content)
  }
  if (Array.isArray(props.content)) {
    for (const child of props.content) {
      if (child && child instanceof HTMLElement) {
        element.appendChild(child)
      }
    }
  }

  if (props.postProcess) {
    props.postProcess(element)
  }
  return element
}

export function createMdiIcon(name: string) {
  return createElement('span', {
    className: 'mdi mdi-' + name,
  })
}

export function clsx(...classes: (string | false | null | undefined | 0)[]) {
  return classes.filter(Boolean).join(' ')
}
