"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTracingIfEnabled = initTracingIfEnabled;
exports.recordHttpSpanResult = recordHttpSpanResult;
/*
  tracing.ts (Phase 14)
  Optional lightweight tracing bootstrap. Avoids hard dependency on OpenTelemetry packages;
  uses dynamic require so build succeeds even if packages are not installed yet.

  Enable by setting TRACING_ENABLED=true at runtime. Optionally set:
    OTEL_EXPORTER_OTLP_ENDPOINT (e.g. http://otel-collector:4318)
    OTEL_SERVICE_NAME (default: balcon-backend)

  If OpenTelemetry modules are not installed, a warning is logged and tracing is skipped gracefully.

  Metrics side-effects:
    Increments tracing.spans.http.server.total / error
    Wraps Sequelize query() to increment tracing.spans.db.query.total / error
*/
const logger_1 = require("../utils/logger");
function initTracingIfEnabled() {
    if (process.env.TRACING_ENABLED !== 'true') {
        return; // disabled
    }
    try {
        // Dynamic requires (no type imports to keep optional)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { NodeSDK } = require('@opentelemetry/sdk-node');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
        if (process.env.OTEL_DEBUG === '1')
            diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
        const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
        const traceExporter = exporterEndpoint ? new OTLPTraceExporter({ url: exporterEndpoint + '/v1/traces' }) : undefined;
        const serviceName = process.env.OTEL_SERVICE_NAME || 'balcon-backend';
        const sdk = new NodeSDK({
            traceExporter,
            serviceName,
            instrumentations: [getNodeAutoInstrumentations({
                    '@opentelemetry/instrumentation-http': { ignoreIncomingPaths: ['/health', '/api/metrics', '/api/metrics/health'] }
                })]
        });
        sdk.start().then(() => logger_1.logger.info('[tracing] OpenTelemetry SDK started')).catch((e) => logger_1.logger.warn('[tracing] SDK start failed', e));
        // Expose shutdown hook
        process.on('SIGTERM', () => { sdk.shutdown().finally(() => process.exit(0)); });
        // Attempt Sequelize query wrapping for DB span metrics
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const sequelizeModule = require('sequelize');
            const origQuery = sequelizeModule.Sequelize.prototype.query;
            sequelizeModule.Sequelize.prototype.query = async function patchedQuery(sql, options) {
                const start = Date.now();
                try {
                    const res = await origQuery.apply(this, [sql, options]);
                    incrementMetricSafe('tracing.spans.db.query.total');
                    return res;
                }
                catch (err) {
                    incrementMetricSafe('tracing.spans.db.query.total');
                    incrementMetricSafe('tracing.spans.db.query.error');
                    throw err;
                }
                finally {
                    const _ms = Date.now() - start; // reserved for future latency histogram
                    // We could push duration to a histogram later if desired.
                }
            };
        }
        catch { /* ignore if sequelize not present or wrapping fails */ }
    }
    catch (err) {
        logger_1.logger.warn('[tracing] OpenTelemetry not initialized (modules missing?)');
    }
}
function incrementMetricSafe(name) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { metrics } = require('../monitoring/metrics');
        metrics.increment(name, 1);
    }
    catch { /* ignore */ }
}
// Helper to wrap HTTP middleware span metrics if tracing disabled or not using auto-instrumentation.
function recordHttpSpanResult(error) {
    incrementMetricSafe('tracing.spans.http.server.total');
    if (error)
        incrementMetricSafe('tracing.spans.http.server.error');
}
