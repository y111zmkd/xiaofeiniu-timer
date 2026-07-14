const CACHE_NAME = 'xiaofeiniu-shell-v4';
const HOME_URL = new URL('./', self.registration.scope).href;
const APP_SHELL = [
  './',
  './manifest.webmanifest',
  './assets/icon-180-v4.png',
  './assets/icon-192-v4.png',
  './assets/icon-512-v4.png',
];

const absoluteUrl = (path) => new URL(path, self.registration.scope).href;

async function fetchAndCache(path, attempts = 3) {
  const url = absoluteUrl(path);
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, response.clone());
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function prepareAppShell() {
  await fetchAndCache('./');
  await Promise.allSettled(APP_SHELL.slice(1).map((path) => fetchAndCache(path)));
}

async function isOfflineReady() {
  const cache = await caches.open(CACHE_NAME);
  const matches = await Promise.all(APP_SHELL.map((path) => cache.match(absoluteUrl(path))));
  return matches.every(Boolean);
}

async function notifyOfflineReady(target) {
  if (!(await isOfflineReady())) return;
  const message = { type: 'OFFLINE_READY' };
  if (target) {
    target.postMessage(message);
    return;
  }
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function updateHomeCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(HOME_URL, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(prepareAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('xiaofeiniu-shell-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
    await notifyOfflineReady();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CHECK_OFFLINE_READY') {
    event.waitUntil((async () => {
      if (await isOfflineReady()) {
        await notifyOfflineReady(event.source);
        return;
      }
      await prepareAppShell();
      await notifyOfflineReady(event.source);
    })().catch(() => undefined));
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    const updatePromise = updateHomeCache(event.request)
      .then(async (response) => {
        await notifyOfflineReady();
        return response;
      })
      .catch(() => undefined);
    event.waitUntil(updatePromise.then(() => undefined));
    event.respondWith(caches.match(HOME_URL).then((cached) => cached || updatePromise.then((response) => response || Response.error())));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
      await notifyOfflineReady();
    }
    return response;
  })));
});
