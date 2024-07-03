import getTools from './index'

const tool = getTools()[0]
tool
  .function({ query: 'aktyn' })
  .then((result) => {
    const formattedResult = JSON.stringify(JSON.parse(result), null, 2)
    console.info(`Result: ${formattedResult}`)
  })
  .catch(console.error)
