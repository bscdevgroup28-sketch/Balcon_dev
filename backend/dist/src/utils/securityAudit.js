"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentSecurityEvents = getRecentSecurityEvents;
exports.logSecurityEvent = logSecurityEvent;
const logger_1 = require("./logger");
const securityMetrics_1 = require("./securityMetrics");
const SecurityAuditEvent_1 = require("../models/SecurityAuditEvent");
// In-memory ring buffer for recent security events (lightweight audit query stub)
const MAX_BUFFER = 500;
const auditBuffer = [];
function getRecentSecurityEvents(filter) {
    let data = auditBuffer.slice();
    if (filter?.action)
        data = data.filter(e => e.action === filter.action);
    if (filter?.outcome)
        data = data.filter(e => e.outcome === filter.outcome);
    if (filter?.since)
        data = data.filter(e => e.timestamp >= filter.since);
    return data;
}
// Central helper to emit structured security/audit events.
function logSecurityEvent(req, evt) {
    try {
        const actorUserId = evt.actorUserId !== undefined ? evt.actorUserId : req?.user?.id;
        const actorRole = evt.actorRole !== undefined ? evt.actorRole : req?.user?.role;
        const ip = evt.ip || req?.ip || req?.connection?.remoteAddress;
        const requestId = evt.requestId || req?.requestId;
        const event = {
            action: evt.action,
            outcome: evt.outcome,
            actorUserId,
            actorRole,
            targetUserId: evt.targetUserId,
            ip,
            meta: evt.meta,
            requestId,
            timestamp: new Date().toISOString()
        };
        // Use a clear prefix and attach structured event for downstream processing
        logger_1.logger.info(`[AUDIT] ${event.action} ${event.outcome}` + (event.targetUserId ? ` target=${event.targetUserId}` : ''), {
            requestId: event.requestId,
            audit: true,
            event
        });
        // Store in ring buffer (volatile)
        auditBuffer.push(event);
        if (auditBuffer.length > MAX_BUFFER)
            auditBuffer.shift();
        // Async persist (fire-and-forget) – avoid blocking request path
        (async () => {
            try {
                await SecurityAuditEvent_1.SecurityAuditEvent.create({
                    action: event.action,
                    outcome: event.outcome,
                    actorUserId: event.actorUserId,
                    actorRole: event.actorRole,
                    targetUserId: event.targetUserId,
                    ip: event.ip,
                    requestId: event.requestId,
                    meta: event.meta,
                    createdAt: new Date(event.timestamp)
                });
            }
            catch (persistErr) {
                logger_1.logger.debug('Audit persist failure (non-fatal)', { error: persistErr.message });
            }
        })();
        // Lightweight metrics mapping
        switch (event.action) {
            case 'auth.login':
                (0, securityMetrics_1.inc)(event.outcome === 'success' ? 'loginSuccess' : 'loginFailure');
                break;
            case 'auth.refresh.rotate':
                if (event.outcome === 'success')
                    (0, securityMetrics_1.inc)('refreshRotate');
                else
                    (0, securityMetrics_1.inc)('refreshFailure');
                break;
            case 'auth.refresh.reuse_detected':
                (0, securityMetrics_1.inc)('refreshReuseDetected');
                break;
            case 'auth.tokens.revoke_all':
                if (event.outcome === 'success')
                    (0, securityMetrics_1.inc)('revokeAll');
                break;
            case 'auth.tokens.list':
                (0, securityMetrics_1.inc)('tokensListed');
                break;
            default:
                break;
        }
    }
    catch (e) {
        // Fallback logging if audit emission fails
        logger_1.logger.warn('Failed to emit security audit event', { error: e.message });
    }
}
