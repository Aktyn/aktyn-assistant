import getTools from './index'

const tool = getTools()[0]
const promise = tool.function({ query: 'aktyn' })
promise.then(console.info).catch(console.error)
