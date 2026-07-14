const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const page = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the page uses always-visible 24-hour scroll wheels', () => {
  assert.match(page, /id="start-hour"/);
  assert.match(page, /id="end-hour"/);
  assert.match(page, /class="wheel"/);
  assert.match(page, /scroll-snap-type:y mandatory/);
  assert.match(page, /initWheel\('start-hour',23/);
  assert.doesNotMatch(page, /<select/);
  assert.doesNotMatch(page, /type="time"/);
});

test('the page does not depend on an external calculator script', () => {
  assert.doesNotMatch(page, /src="flight-duration\.js"/);
});

test('page exposes install metadata and registers offline support', () => {
  assert.match(page, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(page, /rel="apple-touch-icon" href="\.\/assets\/icon-180\.png"/);
  assert.match(page, /name="theme-color" content="#000000"/);
  assert.match(page, /serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('uses start and end terminology', () => {
  assert.match(page, />开始时间</);
  assert.match(page, />结束时间</);
  assert.doesNotMatch(page, />起飞时间</);
  assert.doesNotMatch(page, />落地时间</);
});

test('flight segment defaults to 10:01 through 11:17', () => {
  assert.match(page, /initWheel\('start-hour',23,10/);
  assert.match(page, /initWheel\('start-minute',59,1/);
  assert.match(page, /initWheel\('end-hour',23,11/);
  assert.match(page, /initWheel\('end-minute',59,17/);
  assert.match(page, /id="duration">1 小时 16 分钟</);
});

test('both calculator buttons use the same clear label', () => {
  assert.match(page, /id="clear" type="button">清空<\/button>/);
  assert.match(page, /id="summary-clear" type="button">清空<\/button>/);
  assert.doesNotMatch(page, />清空时间<\/button>/);
});

test('mobile time controls are large and constrained to their card', () => {
  assert.match(page, /min-width:0/);
  assert.match(page, /max-width:100%/);
  assert.match(page, /font-size:clamp\(2\.5rem/);
});

test('does not show instructional hint text', () => {
  assert.doesNotMatch(page, /class="hint"/);
  assert.doesNotMatch(page, /滚动时间选择器|请选择当天的结束时间/);
});

test('centers the time section labels', () => {
  assert.match(page, /\.section h2\{[^}]*text-align:center/);
});

test('uses a compact three-row wheel layout for mobile screens', () => {
  assert.match(page, /\.section\{[^}]*padding:14px/);
  assert.match(page, /\.time-grid\{[^}]*height:168px/);
  assert.match(page, /\.wheel\{[^}]*height:168px/);
  assert.match(page, /padding:56px 0/);
  assert.match(page, /\.notice:empty\{display:none/);
  assert.match(page, /\.result strong\{font-size:clamp\(2\.3rem,10vw,3\.6rem\)/);
});

test('repeats and recenters wheel values for continuous circular scrolling', () => {
  assert.match(page, /COPIES=9/);
  assert.match(page, /index%period/);
  assert.match(page, /middleCycle\*period\+value/);
  assert.match(page, /wheel\.scrollTop=centeredIndex\*rowHeight/);
});

test('provides calculator and summary tabs below the title', () => {
  assert.match(page, /role="tablist"/);
  assert.match(page, />航段时长计算</);
  assert.match(page, />航时汇总运算</);
  assert.match(page, /id="calculator-panel"/);
  assert.match(page, /id="summary-panel"/);
  assert.match(page, /function switchPanel/);
});

test('summary panel reuses the existing card and circular wheel UI', () => {
  assert.match(page, /id="summary-first-hour" class="wheel"/);
  assert.match(page, /id="summary-first-minute" class="wheel"/);
  assert.match(page, /id="summary-second-hour" class="wheel"/);
  assert.match(page, /id="summary-second-minute" class="wheel"/);
  assert.match(page, /initWheel\('summary-first-hour',30,1/);
  assert.match(page, /initWheel\('summary-first-minute',59,0/);
  assert.match(page, /initWheel\('summary-second-hour',30,1/);
  assert.match(page, /initWheel\('summary-second-minute',59,0/);
});

test('summary panel provides add subtract result and independent clear controls', () => {
  assert.match(page, /id="summary-add"/);
  assert.match(page, /id="summary-subtract"/);
  assert.match(page, /id="summary-result"/);
  assert.match(page, /id="summary-notice"/);
  assert.match(page, /id="summary-clear"/);
  assert.match(page, /function updateSummary/);
  assert.match(page, /SECOND_EXCEEDS_FIRST/);
});

test('summary defaults to one hour plus one hour', () => {
  assert.match(page, /summaryState=\{firstHour:1,firstMinute:0,secondHour:1,secondMinute:0,operation:'add'\}/);
  assert.match(page, /id="summary-result">2 小时 0 分钟</);
});

test('hidden summary wheels align their selected values when the tab opens', () => {
  assert.match(page, /if\(wheel\.closest\('\[hidden\]'\)\)return/);
  assert.match(page, /align\(\)\{alignToValue\(targetState\[key\]\)\}/);
  assert.match(page, /summaryControllers\.forEach\(controller=>controller\.align\(\)\)/);
});

test('summary operator defaults to add and clear restores both durations to zero', () => {
  assert.match(page, /summaryState\.operation='add'/);
  assert.match(page, /summaryControllers\.forEach\(controller=>controller\.reset\(0\)\)/);
});

test('summary layout stays compact on narrow mobile screens', () => {
  assert.match(page, /\.summary-panel-content\{/);
  assert.match(page, /\.summary-section\{/);
  assert.match(page, /@media\(max-width:390px\)/);
  assert.doesNotMatch(page, /overflow-x:\s*(auto|scroll)/);
});
