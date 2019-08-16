"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const config_1 = require("./config");
exports.NO_ELECTRON_ENVIRONMENT_ERROR = 'No electron environment';
let window = null;
let ready = false;
async function waitForReady(timeout = 5000) {
    const step = 100;
    const wait = () => new Promise((resolve) => setTimeout(resolve, step));
    while ((timeout -= step) > 0) {
        if (ready)
            return;
        await wait();
    }
    throw new Error('Waiting for electron to be ready timed out');
}
if (electron_1.app) {
    electron_1.app.on('ready', () => {
        ready = true;
    });
    electron_1.app.on('window-all-closed', function () {
        if (process.platform !== 'darwin')
            electron_1.app.quit();
    });
    electron_1.app.on('activate', function () {
        console.log('activate event');
    });
}
const ElectronManager = {
    async openWindow() {
        if (!electron_1.app)
            throw new Error(exports.NO_ELECTRON_ENVIRONMENT_ERROR);
        await waitForReady();
        window = new electron_1.BrowserWindow({
            height: 600,
            useContentSize: true,
            autoHideMenuBar: true,
            title: 'Aktyn Assistant installer',
            icon: path.join(__dirname, '..', 'voice_listener', 'icon.png'),
            webPreferences: {
                nodeIntegration: false,
                allowRunningInsecureContent: false,
                experimentalFeatures: false,
                webSecurity: true
            }
        });
        window.webContents.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36');
        window.on('closed', function () {
            window = null;
        });
        await window.loadURL(`http://localhost:${config_1.default.PORT}?electron=true`);
        if (process.env.NODE_ENV === 'dev')
            window.webContents.toggleDevTools();
    }
};
exports.default = ElectronManager;
