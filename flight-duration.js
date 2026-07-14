(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.calculateFlightDuration = api.calculateFlightDuration;
  root.calculateDurationSummary = api.calculateDurationSummary;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function toMinutes(time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function calculateFlightDuration(takeoff, landing) {
    const start = toMinutes(takeoff);
    const end = toMinutes(landing);
    if (start === null || end === null) return null;
    if (end < start) return null;
    return {
      totalMinutes: end - start,
      crossesMidnight: false,
    };
  }

  function formatFlightDuration(totalMinutes) {
    return `${Math.floor(totalMinutes / 60)} 小时 ${totalMinutes % 60} 分钟`;
  }

  function isValidDuration(duration) {
    return duration
      && Number.isInteger(duration.hours)
      && Number.isInteger(duration.minutes)
      && duration.hours >= 0
      && duration.hours <= 30
      && duration.minutes >= 0
      && duration.minutes <= 59;
  }

  function calculateDurationSummary(first, second, operation) {
    if (!isValidDuration(first) || !isValidDuration(second)) {
      return { totalMinutes: null, formatted: null, error: 'INVALID_DURATION' };
    }

    const firstMinutes = first.hours * 60 + first.minutes;
    const secondMinutes = second.hours * 60 + second.minutes;
    const totalMinutes = operation === 'subtract'
      ? firstMinutes - secondMinutes
      : firstMinutes + secondMinutes;

    if (totalMinutes < 0) {
      return { totalMinutes: null, formatted: null, error: 'SECOND_EXCEEDS_FIRST' };
    }

    return {
      totalMinutes,
      formatted: `${Math.floor(totalMinutes / 60)} 小时 ${totalMinutes % 60} 分钟`,
      error: null,
    };
  }

  return { calculateFlightDuration, formatFlightDuration, calculateDurationSummary };
});
