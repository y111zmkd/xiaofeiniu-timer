const assert = require('node:assert/strict');
const test = require('node:test');
const {
  calculateFlightDuration,
  formatFlightDuration,
  calculateDurationSummary,
} = require('../flight-duration.js');

test('calculates a same-day flight duration', () => {
  assert.deepEqual(calculateFlightDuration('13:46', '15:12'), {
    totalMinutes: 86,
    crossesMidnight: false,
  });
});

test('rejects a landing time earlier than takeoff', () => {
  assert.equal(calculateFlightDuration('23:40', '01:10'), null);
});

test('formats a duration for the large result display', () => {
  assert.equal(formatFlightDuration(86), '1 小时 26 分钟');
});

test('adds two flight durations and carries minutes into hours', () => {
  assert.deepEqual(
    calculateDurationSummary(
      { hours: 12, minutes: 35 },
      { hours: 8, minutes: 50 },
      'add',
    ),
    { totalMinutes: 1285, formatted: '21 小时 25 分钟', error: null },
  );

  assert.deepEqual(
    calculateDurationSummary(
      { hours: 1, minutes: 40 },
      { hours: 0, minutes: 35 },
      'add',
    ),
    { totalMinutes: 135, formatted: '2 小时 15 分钟', error: null },
  );
});

test('subtracts one flight duration from another', () => {
  assert.deepEqual(
    calculateDurationSummary(
      { hours: 12, minutes: 35 },
      { hours: 8, minutes: 50 },
      'subtract',
    ),
    { totalMinutes: 225, formatted: '3 小时 45 分钟', error: null },
  );
});

test('allows equal durations to produce zero', () => {
  assert.deepEqual(
    calculateDurationSummary(
      { hours: 5, minutes: 20 },
      { hours: 5, minutes: 20 },
      'subtract',
    ),
    { totalMinutes: 0, formatted: '0 小时 0 分钟', error: null },
  );
});

test('rejects subtraction when the second duration is larger', () => {
  assert.deepEqual(
    calculateDurationSummary(
      { hours: 1, minutes: 10 },
      { hours: 2, minutes: 0 },
      'subtract',
    ),
    { totalMinutes: null, formatted: null, error: 'SECOND_EXCEEDS_FIRST' },
  );
});

test('rejects duration values outside the wheel ranges', () => {
  assert.equal(
    calculateDurationSummary(
      { hours: 31, minutes: 0 },
      { hours: 0, minutes: 0 },
      'add',
    ).error,
    'INVALID_DURATION',
  );
  assert.equal(
    calculateDurationSummary(
      { hours: 0, minutes: 60 },
      { hours: 0, minutes: 0 },
      'add',
    ).error,
    'INVALID_DURATION',
  );
});
