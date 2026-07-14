const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

test('manifest defines the installable mobile app', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

  assert.equal(manifest.name, '小飞牛计时');
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#000000');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);
});

test('service worker precaches the complete app shell', () => {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const shell = [
    './',
    './manifest.webmanifest',
    './assets/icon-180-v4.png',
    './assets/icon-192-v4.png',
    './assets/icon-512-v4.png',
  ];

  for (const file of shell) assert.ok(worker.includes(`'${file}'`), `${file} is not precached`);
  assert.match(worker, /xiaofeiniu-shell-v4/);
  assert.match(worker, /new URL\('\.\/', self\.registration\.scope\)\.href/);
  assert.match(worker, /cache\.put\(HOME_URL/);
  assert.match(worker, /caches\.match\(HOME_URL\)/);
  assert.match(worker, /async function updateHomeCache/);
  assert.match(worker, /event\.waitUntil\(updatePromise\.then/);
  assert.doesNotMatch(worker, /event\.waitUntil\(updateHomeCache\(event\.request\)/);
  assert.match(worker, /async function isOfflineReady/);
  assert.match(worker, /type: 'OFFLINE_READY'/);
  assert.match(worker, /type === 'CHECK_OFFLINE_READY'/);
  assert.match(worker, /if \(await isOfflineReady\(\)\)/);
  assert.match(worker, /key\.startsWith\('xiaofeiniu-shell-'\)/);
  assert.doesNotMatch(worker, /keys\.filter\(\(key\) => key !== CACHE_NAME\)/);
  assert.doesNotMatch(worker, /cache\.put\('\/'/);
  assert.doesNotMatch(worker, /caches\.match\('\/'\)/);
});

test('Vercel serves update-sensitive PWA files with explicit headers', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const serviceWorker = config.headers.find((rule) => rule.source === '/sw.js');
  const manifest = config.headers.find((rule) => rule.source === '/manifest.webmanifest');

  assert.deepEqual(serviceWorker.headers, [
    { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
  ]);
  assert.deepEqual(manifest.headers, [
    { key: 'Content-Type', value: 'application/manifest+json' },
  ]);
});
