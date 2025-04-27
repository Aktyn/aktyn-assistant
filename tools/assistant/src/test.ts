import getTools from './index'
// eslint-disable-next-line import/no-extraneous-dependencies
import 'dotenv/config'

if (
  !process.env.MESSENGER_SESSION_COOKIES &&
  !(process.env.MESSENGER_USERNAME && process.env.MESSENGER_PASSWORD)
) {
  console.error(
    'MESSENGER_SESSION_COOKIES is not set or MESSENGER_USERNAME and MESSENGER_PASSWORD are not set',
  )
  process.exit(1)
}

const [openSiteOrRunApplicationTool, sendChatMessageTool] = getTools({
  userDataPath: process.env.PUPPETEER_USER_DATA_DIRECTORY,
  username: process.env.MESSENGER_USERNAME!,
  password: process.env.MESSENGER_PASSWORD!,
  cookies: process.env.MESSENGER_SESSION_COOKIES,
})

//TODO: restore
// Promise.all([
//   openSiteOrRunApplicationTool.function({
//     url_or_query: 'https://github.com/Aktyn/aktyn-assistant',
//   }),
//   openSiteOrRunApplicationTool.function({
//     url_or_query: 'github aktyn assistant',
//   }),
// ])
//   .then((results) => {
//     console.info(results.join('\n\n'))
//   })
//   .catch(console.error)

if (sendChatMessageTool) {
  //TODO: temporary disabled
  // sendChatMessageTool
  //   .function({
  //     recipient: 'Radek',
  //     message: 'Mock message',
  //   })
  //   .then(console.info)
  //   .catch(console.error)
} else {
  console.warn('Send chat message tool is not supported')
}
