import { Button } from '@nextui-org/button'
import { Input } from '@nextui-org/input'

function App() {
  return (
    <div>
      <div className="b-red font-bold underline">Hello world</div>
      <Button>Press me</Button>
      <hr />
      <Input placeholder="Type something" />
    </div>
  )
}

export default App
