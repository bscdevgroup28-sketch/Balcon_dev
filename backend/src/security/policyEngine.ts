import { Request } from 'express';
import { logSecurityEvent } from '../utils/securityAudit';
import { inc } from '../utils/securityMetrics';
import client from 'prom-client';
import { Actions } from './actions';

export type PolicyDecision = {
  allow: boolean;
  reason?: string;
  obligationHeaders?: Record<string,string>;
};

export interface PolicyContext {
  user?: { id: number; role: string; permissions: string[] };
  action: string;              // canonical action id e.g. project.read, user.invite
  resource?: { type: string; ownerId?: number; attributes?: Record<string, any> };
  request?: Request;
  extra?: Record<string, any>;
}

// Simple rule representation
interface Rule {
  id: string;
  effect: 'allow' | 'deny';
  match: (ctx: PolicyContext) => boolean;
  priority: number; // higher first
}

// Metrics
const policyDecisionCounter = new client.Counter({ name: 'policy_decisions_total', help: 'Policy decisions', labelNames: ['action','outcome','role'] });
const policyEvaluationDuration = new client.Histogram({ name: 'policy_evaluation_duration_seconds', help: 'Policy evaluation latency', buckets: [0.001,0.005,0.01,0.05,0.1,0.25,0.5] });

const rules: Rule[] = [
  // System admin super-power
  {
    id: 'system-admin-allow-all',
    effect: 'allow',
    priority: 1000,
    match: (ctx) => !!ctx.user && ctx.user.permissions.includes('system_admin')
  },
  // Material management policies (office_manager, shop_manager, owner, admin)
  {
    id: 'material-create-managers',
    effect: 'allow',
    priority: 422,
    match: (ctx) => ctx.action === 'material.create' && ['office_manager','shop_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'material-update-managers',
    effect: 'allow',
    priority: 422,
    match: (ctx) => ctx.action === 'material.update' && ['office_manager','shop_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'material-delete-managers',
    effect: 'allow',
    priority: 422,
    match: (ctx) => ctx.action === 'material.delete' && ['office_manager','shop_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'material-stock-update-managers',
    effect: 'allow',
    priority: 422,
    match: (ctx) => ctx.action === 'material.stock.update' && ['office_manager','shop_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  // Owner role full access
  {
    id: 'owner-role-allow-all',
    effect: 'allow',
    priority: 900,
    match: (ctx) => ctx.user?.role === 'owner'
  },
  // Basic read actions open to project_manager
  {
    id: 'pm-read-projects',
    effect: 'allow',
    priority: 400,
  match: (ctx) => ctx.action === Actions.PROJECT_READ && ctx.user?.role === 'project_manager'
  },
  // Order management (create/update/delete) restricted to office_manager and above
  {
    id: 'order-create-office-manager+',
    effect: 'allow',
    priority: 450,
  match: (ctx) => ctx.action === Actions.ORDER_CREATE && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'order-update-office-manager+',
    effect: 'allow',
    priority: 450,
  match: (ctx) => ctx.action === Actions.ORDER_UPDATE && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'order-delete-owner-admin',
    effect: 'allow',
    priority: 450,
  match: (ctx) => ctx.action === Actions.ORDER_DELETE && ['owner','admin'].includes(ctx.user?.role || '')
  },
  // User management (owner only for now)
  {
    id: 'user-list-owner',
    effect: 'allow',
    priority: 500,
  match: (ctx) => ctx.action === Actions.USER_LIST && ctx.user?.role === 'owner'
  },
  {
    id: 'user-create-owner',
    effect: 'allow',
    priority: 500,
  match: (ctx) => ctx.action === Actions.USER_CREATE && ctx.user?.role === 'owner'
  },
  {
    id: 'user-delete-owner',
    effect: 'allow',
    priority: 500,
  match: (ctx) => ctx.action === Actions.USER_DELETE && ctx.user?.role === 'owner'
  },
  // Feature flags (managed by owner or office_manager)
  {
    id: 'feature-flag-list',
    effect: 'allow',
    priority: 420,
  match: (ctx) => ctx.action === Actions.FEATURE_FLAG_LIST && ['owner','office_manager'].includes(ctx.user?.role || '')
  },
  {
    id: 'feature-flag-upsert',
    effect: 'allow',
    priority: 420,
  match: (ctx) => ctx.action === Actions.FEATURE_FLAG_UPSERT && ['owner','office_manager'].includes(ctx.user?.role || '')
  },
  // Project creation/update/delete policies (manager or above for create/update; delete owner only)
  {
    id: 'project-create-manager+',
    effect: 'allow',
    priority: 440,
  match: (ctx) => ctx.action === Actions.PROJECT_CREATE && ['project_manager','office_manager','owner'].includes(ctx.user?.role || '')
  },
  {
    id: 'project-update-manager+',
    effect: 'allow',
    priority: 440,
  match: (ctx) => ctx.action === Actions.PROJECT_UPDATE && ['project_manager','office_manager','owner'].includes(ctx.user?.role || '')
  },
  {
    id: 'project-delete-owner',
    effect: 'allow',
    priority: 440,
  match: (ctx) => ctx.action === Actions.PROJECT_DELETE && ctx.user?.role === 'owner'
  },
  // Owner-specific resource ownership check (generic example)
  {
    id: 'resource-owner-access',
    effect: 'allow',
    priority: 300,
    match: (ctx) => !!ctx.resource?.ownerId && ctx.user?.id === ctx.resource.ownerId
  },
  // Inventory transaction creation (shop_manager, office_manager, owner)
  {
    id: 'inventory-transaction-create-managers',
    effect: 'allow',
    priority: 430,
  match: (ctx) => ctx.action === Actions.INVENTORY_TRANSACTION_CREATE && ['shop_manager','office_manager','owner'].includes(ctx.user?.role || '')
  },
  // Work order management restricted to project_manager and above (create/update)
  {
    id: 'work-order-create-manager+',
    effect: 'allow',
    priority: 425,
    match: (ctx) => ctx.action === Actions.WORK_ORDER_CREATE && ['project_manager','office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'work-order-update-manager+',
    effect: 'allow',
    priority: 425,
    match: (ctx) => ctx.action === Actions.WORK_ORDER_UPDATE && ['project_manager','office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  // Change order policies
  {
    id: 'change-order-create-manager+',
    effect: 'allow',
    priority: 426,
    match: (ctx) => ctx.action === Actions.CHANGE_ORDER_CREATE && ['project_manager','office_manager','owner','admin'].includes((ctx.user?.role) || '')
  },
  {
    id: 'change-order-update-manager+',
    effect: 'allow',
    priority: 426,
    match: (ctx) => ctx.action === Actions.CHANGE_ORDER_UPDATE && ['project_manager','office_manager','owner','admin'].includes((ctx.user?.role) || '')
  },
  {
    id: 'change-order-delete-owner-admin',
    effect: 'allow',
    priority: 426,
    match: (ctx) => ctx.action === Actions.CHANGE_ORDER_DELETE && ['owner','admin'].includes((ctx.user?.role) || '')
  },
  {
    id: 'change-order-approve-office-manager+',
    effect: 'allow',
    priority: 426,
    match: (ctx) => ctx.action === Actions.CHANGE_ORDER_APPROVE && ['project_manager','office_manager','owner','admin'].includes((ctx.user?.role) || '')
  },
  // Invoice policies: create/update/send by office_manager and above; mark-paid office_manager and above
  {
    id: 'invoice-create-office-manager+',
    effect: 'allow',
    priority: 424,
    match: (ctx) => ctx.action === Actions.INVOICE_CREATE && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'invoice-update-office-manager+',
    effect: 'allow',
    priority: 424,
    match: (ctx) => ctx.action === Actions.INVOICE_UPDATE && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'invoice-send-office-manager+',
    effect: 'allow',
    priority: 424,
    match: (ctx) => ctx.action === Actions.INVOICE_SEND && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'invoice-mark-paid-office-manager+',
    effect: 'allow',
    priority: 424,
    match: (ctx) => ctx.action === Actions.INVOICE_MARK_PAID && ['office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  // Purchase order policies: create/receive by shop_manager and above
  {
    id: 'po-create-shop-manager+',
    effect: 'allow',
    priority: 423,
    match: (ctx) => ctx.action === Actions.PURCHASE_ORDER_CREATE && ['shop_manager','office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  {
    id: 'po-receive-shop-manager+',
    effect: 'allow',
    priority: 423,
    match: (ctx) => ctx.action === Actions.PURCHASE_ORDER_RECEIVE && ['shop_manager','office_manager','owner','admin'].includes(ctx.user?.role || '')
  },
  // Default deny (implicit if nothing matches)
];

export function evaluatePolicy(ctx: PolicyContext): PolicyDecision {
  const endTimer = policyEvaluationDuration.startTimer();
  try {
    for (const rule of rules.sort((a,b)=>b.priority - a.priority)) {
      try {
        if (rule.match(ctx)) {
          if (rule.effect === 'allow') return { allow: true };
          return { allow: false, reason: `Rule ${rule.id} deny` };
        }
      } catch (e) {
        // ignore rule errors
      }
    }
    return { allow: false, reason: 'No matching allow rule' };
  } finally {
    endTimer();
  }
}

export function authorize(ctx: PolicyContext): PolicyDecision {
  const decision = evaluatePolicy(ctx);
  const role = ctx.user?.role || 'anonymous';
  if (decision.allow) {
    logSecurityEvent(ctx.request, { action: `policy.allowed:${ctx.action}`, outcome: 'success' });
    try { inc('policyAllow'); policyDecisionCounter.inc({ action: ctx.action, outcome: 'allow', role }); } catch { /* ignore */ }
  } else {
    logSecurityEvent(ctx.request, { action: `policy.denied:${ctx.action}`, outcome: 'denied', meta: { reason: decision.reason } });
    try { inc('policyDeny'); policyDecisionCounter.inc({ action: ctx.action, outcome: 'deny', role }); } catch { /* ignore */ }
  }
  return decision;
}

export function registerRule(rule: Rule) {
  rules.push(rule);
}

export function listRules() {
  return rules.map(r => ({ id: r.id, effect: r.effect, priority: r.priority }));
}
