"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_manager_1 = require("./electron_manager");
console.log('NODE_ENV:', process.env.NODE_ENV);
const express = require("express");
const fs = require("fs");
const path = require("path");
const config_1 = require("./config");
const app = express();
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.listen(config_1.default.PORT, () => console.log(`Server listens on: ${config_1.default.PORT}!`));
const client_dir = path.join(__dirname, '..', 'voice_listener');
app.use(express.static(client_dir));
const index_html = fs.readFileSync(client_dir + '/index.html', 'utf8');
app.get('*', (req, res) => res.send(index_html));
console.log('Client files are now accessible through express server');
electron_manager_1.default.openWindow().catch(e => {
    if (e.message === electron_manager_1.NO_ELECTRON_ENVIRONMENT_ERROR) {
    }
    else
        console.error(e);
});
