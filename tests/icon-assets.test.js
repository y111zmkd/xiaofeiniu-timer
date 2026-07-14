const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const expectedIcons = [
  ['icon-180.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [filename, size] of expectedIcons) {
  test(`${filename} is a usable square PNG`, () => {
    const icon = fs.readFileSync(path.join(root, 'assets', filename));

    assert.equal(icon.subarray(1, 4).toString('ascii'), 'PNG');
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
    assert.ok(icon.length > 5_000, `${filename} is unexpectedly small`);
  });
}
