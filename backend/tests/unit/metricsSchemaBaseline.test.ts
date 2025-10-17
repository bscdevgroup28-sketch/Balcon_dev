describe('Metrics baseline schema pre-registration', () => {
  it('includes key counters without prior increments', () => {
    const { metrics } = require('../../src/monitoring/metrics');
    const snap = metrics.snapshot();
    const counters = Object.keys(snap.counters);
    const expected = [
      'http.requests.total','http.errors.total','http.errors.5xx','http.errors.429',
      'auth.success','auth.failures','exports.completed','exports.failed',
      'webhooks.delivered','webhooks.failed','db.slow_query.total','tokens.cleanup.runs','tokens.cleanup.removed'
    ];
    for (const name of expected) {
      expect(counters).toContain(name);
      expect(snap.counters[name]).toBe(0);
    }
  });
});
