import * as express from 'express';
import * as bodyParser from "body-parser";
import * as fs from 'fs';
import * as path from 'path';
import Config from "./config";
import {encodeBase64, executeCommand} from "./utils";
import {parseResult} from './result_parser';

const SESSION_ID = encodeBase64( Date.now().toString() );
const app = express();

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Session:', SESSION_ID);

/*app.use(function(req, res, next) {//ALLOW CROSS-DOMAIN REQUESTS
	res.header('Access-Control-Allow-Origin','*');
	res.header('Access-Control-Allow-Methods','GET,POST');
	res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');
	
	next();
});*/

const client_dir = path.join(__dirname, '..', 'voice_listener');
app.use(express.static(client_dir));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({limit: '10mb'}));

app.get('/ping', (req, res) => {
	if( req.query['session_id'] !== SESSION_ID )
		res.send('INCORRECT_SESSION');
	else
		res.send('OK');
});

app.post('/check_result', (req, res) => {//result, confidence, index, type
	for(let [key, type] of [['result', 'string'], ['confidence', 'number'], ['index', 'number'], ['type', 'number']]) {
		if( typeof req.body[key] !== type )
			return res.jsonp({res: 'incorrect input'});
	}
	
	if( parseResult(req.body) )
		return res.jsonp({res: 'executed'});
	
	return res.jsonp({res: 'ignored'});
});

const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
app.get('*', (req, res) => res.send(index_html));
console.log('Client files are now accessible through express server');

app.listen(Config.PORT, () => console.log(`Server listens on: ${Config.PORT}!`));

/////////////////////////////////////////////////////////////////////////////////

const executable = 'google-chrome';//TODO - change according to OS
executeCommand(`${executable} --app=http://localhost:${Config.PORT}?session=${
	SESSION_ID} --app-shell-host-window-size=256x414`).catch(e =>
{
	console.error(e);
});