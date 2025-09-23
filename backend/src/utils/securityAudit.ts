import { logger } from './logger';
import { Request } from 'express';

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
  } catch (e) {
    // Fallback logging if audit emission fails
    logger.warn('Failed to emit security audit event', { error: (e as Error).message });
  }
}
