import { isTool, type Tool } from '@aktyn-assistant/common'

//TODO: test by mocking file system
export async function loadTools(): Promise<Array<Tool>> {
  //TODO get from user config and pass to this function as an argument
  const fileList: string[] = [
    // '/home/aktyn/Programming/aktyn-assistant/tools/weather/dist/index.js',
  ]

  const tools: Array<Tool> = []

  for (const indexPath of fileList) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: index } = require(indexPath)
      if (typeof index !== 'function') {
        throw new Error(
          'Tool index file must default export a function that returns array of tools',
          index,
        )
      }
      for (const tool of index()) {
        if (isTool(tool)) {
          tools.push(tool)
        } else {
          throw new Error('Tool is not valid', tool)
        }
      }
    } catch (error) {
      console.error(`Error while loading tool "${indexPath}"`, error)
    }
  }

  return tools
}
