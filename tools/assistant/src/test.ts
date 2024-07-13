import getTools from './index'

const [openSiteOrRunApplicationTool] = getTools()

Promise.all([
  openSiteOrRunApplicationTool.function({
    url_or_query: 'https://github.com/Aktyn/aktyn-assistant',
  }),
  openSiteOrRunApplicationTool.function({
    url_or_query: 'github aktyn assistant',
  }),
])
  .then((results) => {
    console.info(results.join('\n\n'))
  })
  .catch(console.error)
