import getTools from './index'

const [openSiteOrRunApplicationTool] = getTools()

Promise.all([
  // openSiteOrRunApplicationTool.function({ nameOrUrl: 'kate' }),
  // openSiteOrRunApplicationTool.function({ nameOrUrl: 'non-existing-app' }),
  openSiteOrRunApplicationTool.function({
    url: 'https://github.com/Aktyn/aktyn-assistant',
  }),
])
  .then((results) => {
    console.info(results.join('\n\n'))
  })
  .catch(console.error)
