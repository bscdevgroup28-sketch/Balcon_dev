"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = logSecurityEvent;
const logger_1 = require("./logger");
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
    }
    catch (e) {
        // Fallback logging if audit emission fails
        logger_1.logger.warn('Failed to emit security audit event', { error: e.message });
    }
}
