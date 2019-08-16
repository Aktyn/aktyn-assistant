import { app, BrowserWindow/*, session*/ } from 'electron';
import * as path from "path";
import Config from "./config";

export const NO_ELECTRON_ENVIRONMENT_ERROR = 'No electron environment';

let window: BrowserWindow | null = null;
let ready = false;

async function waitForReady(timeout = 5000) {
	const step = 100;
	const wait = () => new Promise((resolve) => <never>setTimeout(resolve, step));
	
	while( (timeout -= step) > 0 ) {
		if(ready)
			return;
		await wait();
	}
	throw new Error('Waiting for electron to be ready timed out');
}

if(app) {
	app.on('ready', () => {
		ready = true;
		/*if(session && session.defaultSession) {
			session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
				callback({
					responseHeaders: {
						...details.responseHeaders,
						'Content-Security-Policy': ['script-src \'self\'']
					}
				})
			});
		}*/
	});
	
	app.on('window-all-closed', function () {
		if (process.platform !== 'darwin')
			app.quit();//TODO: do not quit
	});
	
	app.on('activate', function () {
		//if(window === null)
		//	createWindow();
		console.log('activate event');
	});
	
	/*app.on('web-contents-created', (event, contents) => {
		contents.on('will-navigate', (event, navigationUrl) => {
			console.log('requested navigation:', navigationUrl);
			event.preventDefault();
		});
	});*/
}

const ElectronManager = {
	async openWindow() {
		if( !app )
			throw new Error(NO_ELECTRON_ENVIRONMENT_ERROR);
		
		await waitForReady();
		// Create the browser window
	    window = new BrowserWindow({
	        // width: 1280,
	        height: 600,
		    useContentSize: true,
	        autoHideMenuBar: true,
	        title: 'Aktyn Assistant installer',
			icon: path.join(__dirname, '..', 'voice_listener', 'icon.png'),
		    webPreferences: {
				nodeIntegration: false,
				//contextIsolation: true,
				//sandbox: true,
			    allowRunningInsecureContent: false,
			    experimentalFeatures: false,
				webSecurity: true
			}
	    });
	    
	    window.webContents.setUserAgent(
	    	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
	    );
	    
	    window.on('closed', function () {
	        window = null;
	    });
	
	    // Load the index.html
	    //await window.loadFile(path.join(__dirname, '..', 'voice_listener', 'index.html'));
		await window.loadURL(`http://localhost:${Config.PORT}?electron=true`);
	    //window.setMenu(null);
		if( process.env.NODE_ENV === 'dev' )
			window.webContents.toggleDevTools();
	}
};

export default ElectronManager;