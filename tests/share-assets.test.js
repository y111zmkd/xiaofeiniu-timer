const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const productionUrl = 'https://y111zmkd.github.io/xiaofeiniu-timer/';

test('sharing QR is a PNG that records the production URL', () => {
  const qr = fs.readFileSync(path.join(root, '小飞牛计时-分享二维码.png'));

  assert.equal(qr.subarray(1, 4).toString('ascii'), 'PNG');
  assert.ok(qr.includes(Buffer.from(productionUrl)), 'production URL metadata is missing');
  assert.ok(qr.length > 1_000, 'QR image is unexpectedly small');
});

test('README publishes GitHub Pages as the official URL', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

  assert.match(readme, new RegExp(productionUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(readme, /正式网址：\[https:\/\/xiaofeiniu-timer\.vercel\.app/);
});
