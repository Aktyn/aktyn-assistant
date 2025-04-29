import { useContext } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Background } from './components/Background'
import { Content } from './components/Content'
import { Menu } from './components/Menu'
import { TitleHeader } from './components/TitleHeader'
import {
  GlobalContext,
  GlobalContextProvider,
} from './context/GlobalContextProvider'
import { useQuickChatMode } from './hooks/useQuickChatMode'
import { Chat } from './views/Chat'

export default function App() {
  const quickChatMode = useQuickChatMode()

  if (!window.electronAPI) {
    return (
      <div className="flex flex-col items-center justify-center h-lvh">
        <p className="text-center text-orange-500 text-xl font-bold text-balance">
          This application is not running in the Electron environment!
        </p>
      </div>
    )
  }

  return (
    <GlobalContextProvider>
      {!quickChatMode ? (
        <>
          <Background />
          <div
            className="grid h-lvh"
            style={{ gridTemplateColumns: 'auto 1fr' }}
          >
            <Menu />
            <Main />
          </div>
        </>
      ) : (
        <Chat in quickChatMode />
      )}
    </GlobalContextProvider>
  )
}

const Main = () => {
  return (
    <main className="flex flex-col justify-center items-center overflow-hidden relative">
      <ContentBackground />
      <TitleHeader />
      <Content />
    </main>
  )
}

const ContentBackground = () => {
  const { ready, waitingForWhisper } = useContext(GlobalContext)

  if (!ready) {
    return (
      <div className="flex items-center justify-center fixed top-0 left-0 w-full h-full fade-in">
        <Loader2 className="w-24 h-24 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      {/* TODO */}
      {/* <div className="fixed-stroke flex items-center justify-center absolute top-0 left-0 w-full h-full">
        <Icon
          className="h-[61.8%] max-h-full max-w-full w-auto fill-primary-600/5 fade-in blur-md"
          path="M17.8764 22.3069L17.915 15.3908L23.83 11.9327L22.2793 11.032L17.915 13.5894L17.8764 8.56434L13.532 6.01854L17.9536 3.49447L17.9536 1.69305L11.9807 5.11748L6.04645 1.69305V3.49447L10.43 6.01819L6.1236 8.56434L6.10432 13.6223L1.72073 11.032L0.170035 11.9327L6.10432 15.4244L6.1236 22.3069L7.6743 21.4062L7.65501 16.3251L12 18.804L16.3637 16.2918L16.3257 21.4062L17.8764 22.3069ZM16.3635 14.4905L12.0014 17.0018L7.65501 14.5228L7.6743 9.46663L11.9815 6.91934L16.3243 9.46422L16.3635 14.4905Z"
          color="inherit"
        />
      </div>
      <div className="fixed-stroke flex items-center justify-center absolute top-0 left-0 w-full h-full">
        <Icon
          className="h-[61.8%] max-h-full max-w-full w-auto fill-transparent stroke-secondary-200/15 stroke-[0.5] fade-in"
          path="M17.8764 22.3069L17.915 15.3908L23.83 11.9327L22.2793 11.032L17.915 13.5894L17.8764 8.56434L13.532 6.01854L17.9536 3.49447L17.9536 1.69305L11.9807 5.11748L6.04645 1.69305V3.49447L10.43 6.01819L6.1236 8.56434L6.10432 13.6223L1.72073 11.032L0.170035 11.9327L6.10432 15.4244L6.1236 22.3069L7.6743 21.4062L7.65501 16.3251L12 18.804L16.3637 16.2918L16.3257 21.4062L17.8764 22.3069ZM16.3635 14.4905L12.0014 17.0018L7.65501 14.5228L7.6743 9.46663L11.9815 6.91934L16.3243 9.46422L16.3635 14.4905Z"
          color="inherit"
        />
      </div> */}
      {waitingForWhisper && (
        <div className="absolute right-0 bottom-0 p-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Loader2 className="w-6 h-6 animate-spin text-secondary" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Downloading Whisper model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  )
}
