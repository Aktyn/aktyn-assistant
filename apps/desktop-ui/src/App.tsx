import { Background } from './components/Background'
import { Menu } from './components/Menu'
import { TitleHeader } from './components/TitleHeader'
import { GlobalContextProvider } from './context/GlobalContextProvider'

const App = () => {
  return (
    <GlobalContextProvider>
      <Background />
      <div className="grid h-lvh" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <Menu />
        <main className="flex flex-col justify-center items-center overflow-x-auto">
          <TitleHeader />
          {/* <Content /> */}
          <div className="text-foreground">TODO: content</div>
        </main>
      </div>
    </GlobalContextProvider>
  )
}

export default App
