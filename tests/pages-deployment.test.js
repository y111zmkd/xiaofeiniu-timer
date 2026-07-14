const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'pages.yml');

test('GitHub Pages workflow publishes only the runtime app shell', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path: _site/);
  assert.match(workflow, /index\.html manifest\.webmanifest sw\.js/);
  assert.match(workflow, /assets\/icon-\*\.png/);
  assert.match(workflow, /\.nojekyll/);
});
