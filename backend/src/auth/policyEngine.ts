import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Basic policy definition structure; can be extended with ABAC rules later
interface PolicyContext {
  user?: { id: number; role: string; permissions?: string[] };
  resource?: any; // Placeholder – to be resolved lazily
  action: string; // e.g., 'project.read'
  resourceType?: string; // e.g., 'project'
}

interface PolicyDecision {
  allow: boolean;
  reason?: string;
}

type PolicyRule = (ctx: PolicyContext) => PolicyDecision | Promise<PolicyDecision>;

// Role hierarchy (higher index = broader power)
const ROLE_RANKING = [
  'customer',
  'technician',
  'team_leader',
  'project_manager',
  'shop_manager',
  'office_manager',
  'owner'
];

const hasRoleAtLeast = (role: string, minimum: string) => {
  return ROLE_RANKING.indexOf(role) >= ROLE_RANKING.indexOf(minimum);
};

// Policy registry
const rules: Record<string, PolicyRule[]> = {};

export function registerPolicy(action: string, rule: PolicyRule) {
  if (!rules[action]) rules[action] = [];
  rules[action].push(rule);
}

export async function evaluatePolicy(ctx: PolicyContext): Promise<PolicyDecision> {
  const actionRules = rules[ctx.action];
  if (!actionRules || actionRules.length === 0) {
    return { allow: false, reason: 'No policy defined' };
  }
  for (const rule of actionRules) {
    const decision = await rule(ctx);
    if (!decision.allow) return decision; // Fail fast
  }
  return { allow: true };
}

// Express middleware factory
export function authorize(action: string, resourceResolver?: (req: Request) => Promise<any> | any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = resourceResolver ? await resourceResolver(req) : undefined;
      const decision = await evaluatePolicy({
        action,
        user: req.user as any,
        resource,
        resourceType: resource?.__type || undefined
      });
      if (!decision.allow) {
        return res.status(403).json({
          error: 'forbidden',
          message: decision.reason || 'Access denied'
        });
      }
      (req as any).resource = resource;
      next();
    } catch (e) {
      logger.error('Policy evaluation failed', e);
      return res.status(500).json({ error: 'policy_error', message: 'Authorization system error' });
    }
  };
}

// --- Default baseline policies ---

// Example: project.read – allow project managers+, or owner, or if resource owned by user
registerPolicy('project.read', (ctx) => {
  if (!ctx.user) return { allow: false, reason: 'Unauthenticated' };
  if (hasRoleAtLeast(ctx.user.role, 'project_manager')) return { allow: true };
  if (ctx.resource && ctx.resource.userId === ctx.user.id) return { allow: true };
  return { allow: false, reason: 'Not permitted to read project' };
});

registerPolicy('project.update', (ctx) => {
  if (!ctx.user) return { allow: false, reason: 'Unauthenticated' };
  if (hasRoleAtLeast(ctx.user.role, 'project_manager')) return { allow: true };
  return { allow: false, reason: 'Requires project manager role or higher' };
});

registerPolicy('material.manage', (ctx) => {
  if (!ctx.user) return { allow: false, reason: 'Unauthenticated' };
  if (['shop_manager', 'office_manager', 'owner'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Requires shop/office manager or owner' };
});

// Quote policies
registerPolicy('quote.create', (ctx) => {
  if (!ctx.user) return { allow: false, reason: 'Unauthenticated' };
  if (['office_manager','owner','project_manager'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Insufficient role to create quote' };
});
registerPolicy('quote.update', (ctx) => {
  if (!ctx.user) return { allow: false };
  if (['office_manager','owner','project_manager'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Insufficient role to update quote' };
});
registerPolicy('quote.respond', (ctx) => {
  if (!ctx.user) return { allow: false };
  // Customers may respond to their own quotes, managers may respond on behalf
  if (ctx.user.role === 'customer' && ctx.resource && ctx.resource.userId === ctx.user.id) return { allow: true };
  if (['office_manager','owner'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Not permitted to respond to quote' };
});

// Order policies
registerPolicy('order.create', (ctx) => {
  if (!ctx.user) return { allow: false };
  if (['office_manager','owner','project_manager'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Insufficient role to create order' };
});
registerPolicy('order.update', (ctx) => {
  if (!ctx.user) return { allow: false };
  if (['office_manager','owner','project_manager'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Insufficient role to update order' };
});
registerPolicy('order.delete', (ctx) => {
  if (!ctx.user) return { allow: false };
  if (['owner','office_manager'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Delete restricted to management' };
});

// Inventory transaction policies
registerPolicy('inventory.transaction.create', (ctx) => {
  if (!ctx.user) return { allow: false };
  if (['shop_manager','office_manager','owner'].includes(ctx.user.role)) return { allow: true };
  return { allow: false, reason: 'Requires shop/office manager or owner' };
});

// Utility so tests can extend policies
export function clearPolicies() {
  Object.keys(rules).forEach(k => delete rules[k]);
}

export function listPolicies() {
  return Object.keys(rules);
}

export default { authorize, registerPolicy, listPolicies };
