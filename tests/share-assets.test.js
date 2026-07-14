const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const productionUrl = 'https://xiaofeiniu-timer.vercel.app/';

test('sharing QR is a PNG that records the production URL', () => {
  const qr = fs.readFileSync(path.join(root, '小飞牛计时-分享二维码.png'));

  assert.equal(qr.subarray(1, 4).toString('ascii'), 'PNG');
  assert.ok(qr.includes(Buffer.from(productionUrl)), 'production URL metadata is missing');
  assert.ok(qr.length > 1_000, 'QR image is unexpectedly small');
});
