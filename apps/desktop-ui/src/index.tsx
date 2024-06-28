import { StrictMode } from 'react'
import { NextUIProvider } from '@nextui-org/system'
import { SnackbarProvider } from 'notistack'
import { createRoot } from 'react-dom/client'

import './style/index.css'
import './style/prism.css' //TODO: remove (also file) after fixing prismjs
import './style/scrollbars.css'

import App from './App'

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <StrictMode>
    <NextUIProvider>
      <SnackbarProvider
        maxSnack={6}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        autoHideDuration={5000}
        preventDuplicate
      />
      <App />
    </NextUIProvider>
  </StrictMode>,
)
