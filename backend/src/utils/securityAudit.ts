import { logger } from './logger';
import { Request } from 'express';
import { inc } from './securityMetrics';
import { SecurityAuditEvent } from '../models/SecurityAuditEvent';

// In-memory ring buffer for recent security events (lightweight audit query stub)
const MAX_BUFFER = 500;
const auditBuffer: SecurityEvent[] = [];
export function getRecentSecurityEvents(filter?: { action?: string; outcome?: SecurityOutcome; since?: string }) {
  let data = auditBuffer.slice();
  if (filter?.action) data = data.filter(e => e.action === filter.action);
  if (filter?.outcome) data = data.filter(e => e.outcome === filter.outcome);
  if (filter?.since) data = data.filter(e => e.timestamp >= filter.since!);
  return data;
}

export type SecurityOutcome = 'success' | 'failure' | 'locked' | 'denied';

export interface SecurityEvent {
  action: string;               // e.g. auth.login, user.password.change
  outcome: SecurityOutcome;     // success | failure | locked | denied
  actorUserId?: number;         // initiating user (if authenticated)
  actorRole?: string;           // role of initiating user
  targetUserId?: number;        // affected user (for admin actions)
  ip?: string;                  // source IP
  meta?: Record<string, any>;   // safe, non-sensitive supplemental fields
  requestId?: string;           // request correlation id
  timestamp: string;            // ISO timestamp
}

// Central helper to emit structured security/audit events.
export function logSecurityEvent(req: Partial<Request> | undefined, evt: Omit<SecurityEvent, 'timestamp' | 'ip' | 'actorUserId' | 'actorRole' | 'requestId'> & {
  actorUserId?: number;
  actorRole?: string;
  ip?: string;
  requestId?: string;
}) {
  try {
    const actorUserId = evt.actorUserId !== undefined ? evt.actorUserId : (req as any)?.user?.id;
    const actorRole = evt.actorRole !== undefined ? evt.actorRole : (req as any)?.user?.role;
    const ip = evt.ip || (req as any)?.ip || (req as any)?.connection?.remoteAddress;
    const requestId = evt.requestId || (req as any)?.requestId;

    const event: SecurityEvent = {
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
    logger.info(`[AUDIT] ${event.action} ${event.outcome}` + (event.targetUserId ? ` target=${event.targetUserId}` : ''), {
      requestId: event.requestId,
      audit: true,
      event
    });

  // Store in ring buffer (volatile)
  auditBuffer.push(event);
  if (auditBuffer.length > MAX_BUFFER) auditBuffer.shift();

  // Async persist (fire-and-forget) – avoid blocking request path
  (async () => {
    try {
      await SecurityAuditEvent.create({
        action: event.action,
        outcome: event.outcome,
        actorUserId: event.actorUserId,
        actorRole: event.actorRole,
        targetUserId: event.targetUserId,
        ip: event.ip,
        requestId: event.requestId,
        meta: event.meta,
        createdAt: new Date(event.timestamp)
      } as any);
    } catch (persistErr) {
      logger.debug('Audit persist failure (non-fatal)', { error: (persistErr as Error).message });
    }
  })();

  // Lightweight metrics mapping
    switch (event.action) {
      case 'auth.login':
        inc(event.outcome === 'success' ? 'loginSuccess' : 'loginFailure');
        break;
      case 'auth.refresh.rotate':
        if (event.outcome === 'success') inc('refreshRotate'); else inc('refreshFailure');
        break;
      case 'auth.refresh.reuse_detected':
        inc('refreshReuseDetected');
        break;
      case 'auth.tokens.revoke_all':
        if (event.outcome === 'success') inc('revokeAll');
        break;
      case 'auth.tokens.list':
        inc('tokensListed');
        break;
      default:
        break;
    }
  } catch (e) {
    // Fallback logging if audit emission fails
    logger.warn('Failed to emit security audit event', { error: (e as Error).message });
  }
}
