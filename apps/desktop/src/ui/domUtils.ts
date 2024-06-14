type Props = {
  className?: string
  content?: string | HTMLElement
  style?: Partial<CSSStyleDeclaration>
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
  props: Props = {},
): HTMLElementTagNameMap[TagName] {
  const element = document.createElement(tagName)
  if (props.className) {
    element.className = props.className
  }
  if (typeof props.content === 'string') {
    element.innerText = props.content
  }
  if (props.content instanceof HTMLElement) {
    element.appendChild(props.content)
  }
  if (props.style) {
    Object.assign(element.style, props.style)
  }
  return element
}
