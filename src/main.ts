import ElectronManager, {NO_ELECTRON_ENVIRONMENT_ERROR} from './electron_manager';

console.log('NODE_ENV:', process.env.NODE_ENV);

import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import Config from "./config";

const app = express();

app.use(function(req, res, next) {//ALLOW CROSS-DOMAIN REQUESTS
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods','GET,POST');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');

    next();
});

app.listen(Config.PORT, () => console.log(`Server listens on: ${Config.PORT}!`));

const client_dir = path.join(__dirname, '..', 'voice_listener');
app.use(express.static(client_dir));

const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
app.get('*', (req, res) => res.send(index_html));
console.log('Client files are now accessible through express server');

ElectronManager.openWindow().catch(e => {
    if(e.message === NO_ELECTRON_ENVIRONMENT_ERROR) {
        //handle it differently
    }
	else
	    console.error(e);
});