"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const config_1 = require("./config");
const utils_1 = require("./utils");
const result_parser_1 = require("./result_parser");
const SESSION_ID = utils_1.encodeBase64(Date.now().toString());
const app = express();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Session:', SESSION_ID);
const client_dir = path.join(__dirname, '..', 'voice_listener');
app.use(express.static(client_dir));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.get('/ping', (req, res) => {
    if (req.query['session_id'] !== SESSION_ID)
        res.send('INCORRECT_SESSION');
    else
        res.send('OK');
});
app.post('/check_result', (req, res) => {
    for (let [key, type] of [['result', 'string'], ['confidence', 'number'], ['index', 'number'], ['type', 'number']]) {
        if (typeof req.body[key] !== type)
            return res.jsonp({ res: 'incorrect input' });
    }
    if (result_parser_1.parseResult(req.body))
        return res.jsonp({ res: 'executed' });
    return res.jsonp({ res: 'ignored' });
});
const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
app.get('*', (req, res) => res.send(index_html));
console.log('Client files are now accessible through express server');
app.listen(config_1.default.PORT, () => console.log(`Server listens on: ${config_1.default.PORT}!`));
const executable = 'google-chrome';
utils_1.executeCommand(`${executable} --app=http://localhost:${config_1.default.PORT}?session=${SESSION_ID} --app-shell-host-window-size=256x414`).catch(e => {
    console.error(e);
});
