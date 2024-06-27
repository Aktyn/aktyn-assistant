import { StrictMode } from 'react'
import { NextUIProvider } from '@nextui-org/system'
import { createRoot } from 'react-dom/client'

import './style/prism.css' //TODO: remove (also file) after fixing prismjs
import './style/scrollbars.css'
import './style/index.css'

import App from './App'

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <StrictMode>
    <NextUIProvider>
      <App />
    </NextUIProvider>
  </StrictMode>,
)
