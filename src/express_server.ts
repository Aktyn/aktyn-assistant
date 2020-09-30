import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

const app = express();

const client_dir = path.join(__dirname, '..', 'voice_listener');

export const INDEX_HTML_PATH = client_dir + '/index.html';
const index_html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

export function init(port: number) {
  app.use(function (req, res, next) {
    //ALLOW CROSS-DOMAIN REQUESTS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
  });

  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  app.use(bodyParser.json({ limit: '10mb' }));

  app.use(express.static(client_dir));

  app.get('*', (req, res) => res.send(index_html));
  app.listen(port);
}
