import { Menu } from './circularMenu'
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

  await header.enter() //TODO: restore await
  await menu.init()

  console.log('Renderer initialized')

  // await header.hide()

  // <span class="mdi mdi-ab-testing"></span><span class="mdi mdi-loading mdi-spin">Processing</span>
}

init().catch(console.error)
