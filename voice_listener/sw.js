'use strict';

const serviceWorkerOption = {
	"assets": [
		"/icon.png",
		"/manifest.json",
		"/manifest.webapp",
		"/style.css",
		"/main.js",
		"/index.html"
	]
};

const DEBUG = false;

const CACHE_NAME = new Date().toISOString();

let assetsToCache = [...serviceWorkerOption.assets, './'].map(path => {
    return new URL(path, location).toString();
});

// When the service worker is first added to a computer.
self.addEventListener('install', event => {
	// Perform install steps.
	if(DEBUG)
		console.log('[SW] Install event');

	// Add core website files to cache during serviceworker installation.
	event.waitUntil(
		caches.open(CACHE_NAME).then(async (cache) => {
			for(let asset of assetsToCache) {
				await cache.add(asset).catch(e => {
					if(DEBUG)
						console.log('Cannot add asset to cache:', asset, 'reason:', e);
				});
			}
		}).then(() => {
			if(DEBUG)
				console.log('Cached assets: main', assetsToCache)
		}).catch(error => {
			if(DEBUG)
				console.error(error);
		})
	);
});

// After the install event.
self.addEventListener('activate', event => {
	if(DEBUG)
		console.log('[SW] Activate event');

	// Clean the caches
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					// Delete the caches that are not the current one.
					if (cacheName.indexOf(CACHE_NAME) === 0)
						return null;

					return caches.delete(cacheName);
				})
			)
		})
	);
});

self.addEventListener('message', event => {
	if (event.data.action === 'skipWaiting') {
		if(self.skipWaiting) {
			self.skipWaiting().catch(console.error);
			self.clients.claim().catch(console.error);
		}
	}
});

self.addEventListener('fetch', event => {
	const request = event.request;

	// Ignore not GET request.
	if (request.method !== 'GET') {
		if(DEBUG)
			console.log(`[SW] Ignore non GET request ${request.method}`);
		return;
	}

	const requestUrl = new URL(request.url);

	// Ignore difference origin.
	if (requestUrl.origin !== location.origin) {
		if(DEBUG)
			console.log(`[SW] Ignore difference origin ${requestUrl.origin}`);
		return;
	}

	const resource = caches.match(request).then(response => {
		if (response) {
			if(DEBUG)
				console.log(`[SW] fetch URL ${requestUrl.href} from cache`);
			return response;
		}

		// Load and cache known assets.
		return fetch(request).then(responseNetwork => {
			if(!responseNetwork || !responseNetwork.ok) {
				if(DEBUG) {
					console.log(
						`[SW] URL [${requestUrl.toString()}] wrong responseNetwork: ${
							responseNetwork.status
						} ${responseNetwork.type}`
					);
				}

				return responseNetwork;
			}

			if(DEBUG)
				console.log(`[SW] URL ${requestUrl.href} fetched`);

			const responseCache = responseNetwork.clone();

			caches.open(CACHE_NAME).then(cache => {
				return cache.put(request, responseCache);
			}).catch(e => {
				if(DEBUG)
					console.error(e);
			});
			return responseNetwork;
		}).catch(() => {
			// User is landing on our page.
			if(event.request.mode === 'navigate')
				return caches.match('./');

			return null;
		});
	});

	event.respondWith(resource);
});