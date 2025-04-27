import {
  getMessengerTool,
  type MessengerToolInitParameters,
} from './tools/messenger'
import { openSiteTool } from './tools/openSite'

export default function index(
  messengerToolInitParameters?: MessengerToolInitParameters,
) {
  return [
    openSiteTool,
    getMessengerTool(messengerToolInitParameters ?? {
      //TODO: handle no messengerToolInitParameters
      username: '',
      password: '',
    }),
    //TODO: more assistant related tools like emails, alarms, etc.
  ] as const
}
