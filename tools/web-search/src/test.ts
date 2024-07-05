import getTools from './index'

const tool = getTools()[0]
const promise = tool.function({ query: 'aktyn' }) as Promise<string>
promise
  .then((result) => {
    const formattedResult = JSON.stringify(JSON.parse(result), null, 2)
    console.info(`Result: ${formattedResult}`)
  })
  .catch(console.error)
