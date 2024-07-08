import getTools from './index'

const [openSiteOrRunApplicationTool] = getTools()

Promise.all([openSiteOrRunApplicationTool.function({ foo: 'bar' })])
  .then((results) => {
    console.info(results.join('\n\n'))
  })
  .catch(console.error)
