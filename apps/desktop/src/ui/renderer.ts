import { Menu, ViewType } from './circularMenu'
import { TitleHeader } from './titleHeader'

function generatePatternBackground() {
  const div = document.getElementById('pattern-bg')
  if (!div) {
    console.warn('Pattern background not found in DOM')
    return
  }

  div.innerText = Array.from({ length: 100 })
    .map((_) => 'I')
    .join('')
}

async function init() {
  const header = new TitleHeader()

  await new Promise((resolve) => setTimeout(resolve, 16))

  const menu = new Menu({
    onViewEnter: () => {
      header.hide().catch(console.error)
    },
    onViewHide: () => {
      header.enter().catch(console.error)
    },
  })
  generatePatternBackground()

  await new Promise((resolve) => setTimeout(resolve, 100))

  anime({
    targets: document.querySelector('#dim-bg'),
    easing: 'easeOutCubic',
    duration: 800,
    delay: 200,
    opacity: 0,
  })

  void header.enter() //TODO: restore await
  void menu.init() //TODO: restore await

  menu.enterView(ViewType.Settings) //TODO: remove
}

init().catch(console.error)
