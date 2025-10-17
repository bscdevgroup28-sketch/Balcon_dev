
// We rely on runtime require of '@sentry/node' inside initSentry. We'll mock it.

describe('initSentry', () => {
  const ORIGINAL_DSN = process.env.SENTRY_DSN;

  const buildLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  });

  afterEach(() => {
    // Cleanup env and module cache so each test sees fresh code
    process.env.SENTRY_DSN = ORIGINAL_DSN;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('initializes Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'http://examplePublicKey@o0.ingest.sentry.io/0';
    const mockInit = jest.fn();
    jest.doMock('@sentry/node', () => ({ init: mockInit }), { virtual: true });

    // Import after mocking
    const { initSentry } = require('../../src/monitoring/metrics');
    const logger = buildLogger();
    initSentry(logger);
    expect(mockInit).toHaveBeenCalledTimes(1);
    const args = mockInit.mock.calls[0][0];
    expect(args.dsn).toContain('examplePublicKey');
    expect(logger.info).toHaveBeenCalledWith('[monitoring] Sentry initialized');
  });

  it('includes release when SENTRY_RELEASE is set', () => {
    process.env.SENTRY_DSN = 'http://examplePublicKey@o0.ingest.sentry.io/0';
    process.env.SENTRY_RELEASE = 'v1.2.3';
    const mockInit = jest.fn();
    jest.doMock('@sentry/node', () => ({ init: mockInit }), { virtual: true });
    const { initSentry } = require('../../src/monitoring/metrics');
    const logger = buildLogger();
    initSentry(logger);
    expect(mockInit).toHaveBeenCalledTimes(1);
    const args = mockInit.mock.calls[0][0];
    expect(args.release).toBe('v1.2.3');
  });

  it('skips initialization when SENTRY_DSN is not set', () => {
    delete process.env.SENTRY_DSN;
    const mockInit = jest.fn();
    // Even if we mock the module, init should not be invoked
    jest.doMock('@sentry/node', () => ({ init: mockInit }), { virtual: true });
    const { initSentry } = require('../../src/monitoring/metrics');
    const logger = buildLogger();
    initSentry(logger);
    expect(mockInit).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('[monitoring] SENTRY_DSN not set; skipping Sentry init');
  });

  it('logs a warning if module load fails (simulated)', () => {
    process.env.SENTRY_DSN = 'dummy';
    // Force require to throw
    jest.doMock('@sentry/node', () => { throw new Error('load fail'); }, { virtual: true });
    const { initSentry } = require('../../src/monitoring/metrics');
    const logger = buildLogger();
    initSentry(logger);
    expect(logger.warn).toHaveBeenCalledWith('[monitoring] Failed to initialize Sentry (is @sentry/node installed?)');
  });
});
