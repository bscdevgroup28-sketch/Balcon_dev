process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.LOG_LEVEL = 'error';

// Intercept process.exit to observe usage but still allow Jest to terminate cleanly.
// Cast to any to avoid signature mismatch; schedule real exit next tick.
(() => {
  const realExit = process.exit.bind(process);
  (process as any).exit = (code?: number) => {
    (global as any).__testExitAttempts = ((global as any).__testExitAttempts || 0) + 1;
    (global as any).__lastTestExitCode = code;
    setImmediate(() => realExit(code as any));
  };
})();

// Silence console noise during tests
['log','info','warn','error'].forEach(m => {
  // @ts-expect-error dynamic console monkey patch for noise suppression
  console[m] = (..._args: any[]) => {};
});
