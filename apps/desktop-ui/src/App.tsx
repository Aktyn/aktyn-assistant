import { Background } from './components/Background'
import { Content } from './components/Content'
import { Menu } from './components/Menu'
import { TitleHeader } from './components/TitleHeader'
import { GlobalContextProvider } from './context/GlobalContextProvider'

const App = () => {
  return (
    <GlobalContextProvider>
      <Background />
      <div className="grid h-lvh" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <Menu />
        <Main />
      </div>
    </GlobalContextProvider>
  )
}

const Main = () => {
  return (
    <main className="flex flex-col justify-center items-center overflow-hidden pt-8">
      <TitleHeader />
      <Content />
    </main>
  )
}

export default App
