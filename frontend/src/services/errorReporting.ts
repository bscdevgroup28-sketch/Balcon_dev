// Lightweight error reporting abstraction.
// Replace SENTRY_DSN at build time / env for activation.

interface ReportOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

// Runtime flag check (can be extended to feature flag service)
const isEnabled = !!(process.env.REACT_APP_SENTRY_DSN);

// Lazy loaded Sentry container
let sentryInitialized = false;

async function ensureSentry() {
  if (!isEnabled || sentryInitialized) return;
  const Sentry = await import('@sentry/browser');
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [],
    tracesSampleRate: 0.1,
  });
  sentryInitialized = true;
}

export async function reportError(error: unknown, options: ReportOptions = {}) {
  try {
    await ensureSentry();
    if (!isEnabled) return;
    const Sentry = await import('@sentry/browser');
    Sentry.captureException(error, {
      tags: options.tags,
      extra: options.extra,
    });
  } catch (e) {
    // Swallow to avoid cascading failures
    // Optionally: console.log('Error reporting failed', e);
  }
}

export function reportMessage(message: string, options: ReportOptions = {}) {
  if (!isEnabled) return;
  import('@sentry/browser').then(Sentry => {
    Sentry.captureMessage(message, {
      level: 'info',
      tags: options.tags,
      extra: options.extra,
    });
  }).catch(() => {});
}

export const errorReportingStatus = {
  enabled: isEnabled,
};
