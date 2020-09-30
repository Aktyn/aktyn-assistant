import { Server } from 'ws';

import ListenerConnection from './listener_connection';

let open_port = 0;

export function init(port: number) {
  if (open_port) throw new Error('WebSocket server already runs at ws_port ' + open_port);
  open_port = port;

  console.log('Running WebSocket server at ws_port:', port);

  const websocket = new Server({ port });

  websocket.on('connection', function (ws) {
    (<any>ws).isAlive = true;
    ws.on('pong', () => {
      (<any>ws).isAlive = true; //heartbeat
    });

    //new client's connection
    const connection = new ListenerConnection(ws);
    //Connections.add(ws, req);

    ws.on('message', function (message) {
      //onMessage(connection, message);
      connection.onMessage(message);
    });

    ws.on('close', () => {
      // close user connection
      console.log('connection close:', connection.id);
      connection.destroy();
      ws.removeAllListeners();
      //onDisconnect(connection);
      //Connections.remove(connection);
    });
  });

  //detecting dead connections
  setInterval(function ping() {
    websocket.clients.forEach(ws => {
      if ((<any>ws).isAlive === false) {
        //connection didn't send pong in time
        console.log('removing dead connection');
        return ws.terminate();
      }

      (<any>ws).isAlive = false;
      ws.ping(() => void 0);
    });
  }, 30 * 1000); //check every 30 seconds
}
