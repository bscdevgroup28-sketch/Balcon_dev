"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePolicy = evaluatePolicy;
exports.authorize = authorize;
exports.registerRule = registerRule;
exports.listRules = listRules;
const securityAudit_1 = require("../utils/securityAudit");
const securityMetrics_1 = require("../utils/securityMetrics");
const prom_client_1 = __importDefault(require("prom-client"));
const actions_1 = require("./actions");
// Metrics
const policyDecisionCounter = new prom_client_1.default.Counter({ name: 'policy_decisions_total', help: 'Policy decisions', labelNames: ['action', 'outcome', 'role'] });
const policyEvaluationDuration = new prom_client_1.default.Histogram({ name: 'policy_evaluation_duration_seconds', help: 'Policy evaluation latency', buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5] });
const rules = [
    // System admin super-power
    {
        id: 'system-admin-allow-all',
        effect: 'allow',
        priority: 1000,
        match: (ctx) => !!ctx.user && ctx.user.permissions.includes('system_admin')
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
        match: (ctx) => ctx.action === actions_1.Actions.PROJECT_READ && ctx.user?.role === 'project_manager'
    },
    // Order management (create/update/delete) restricted to office_manager and above
    {
        id: 'order-create-office-manager+',
        effect: 'allow',
        priority: 450,
        match: (ctx) => ctx.action === actions_1.Actions.ORDER_CREATE && ['office_manager', 'owner', 'admin'].includes(ctx.user?.role || '')
    },
    {
        id: 'order-update-office-manager+',
        effect: 'allow',
        priority: 450,
        match: (ctx) => ctx.action === actions_1.Actions.ORDER_UPDATE && ['office_manager', 'owner', 'admin'].includes(ctx.user?.role || '')
    },
    {
        id: 'order-delete-owner-admin',
        effect: 'allow',
        priority: 450,
        match: (ctx) => ctx.action === actions_1.Actions.ORDER_DELETE && ['owner', 'admin'].includes(ctx.user?.role || '')
    },
    // User management (owner only for now)
    {
        id: 'user-list-owner',
        effect: 'allow',
        priority: 500,
        match: (ctx) => ctx.action === actions_1.Actions.USER_LIST && ctx.user?.role === 'owner'
    },
    {
        id: 'user-create-owner',
        effect: 'allow',
        priority: 500,
        match: (ctx) => ctx.action === actions_1.Actions.USER_CREATE && ctx.user?.role === 'owner'
    },
    {
        id: 'user-delete-owner',
        effect: 'allow',
        priority: 500,
        match: (ctx) => ctx.action === actions_1.Actions.USER_DELETE && ctx.user?.role === 'owner'
    },
    // Feature flags (managed by owner or office_manager)
    {
        id: 'feature-flag-list',
        effect: 'allow',
        priority: 420,
        match: (ctx) => ctx.action === actions_1.Actions.FEATURE_FLAG_LIST && ['owner', 'office_manager'].includes(ctx.user?.role || '')
    },
    {
        id: 'feature-flag-upsert',
        effect: 'allow',
        priority: 420,
        match: (ctx) => ctx.action === actions_1.Actions.FEATURE_FLAG_UPSERT && ['owner', 'office_manager'].includes(ctx.user?.role || '')
    },
    // Project creation/update/delete policies (manager or above for create/update; delete owner only)
    {
        id: 'project-create-manager+',
        effect: 'allow',
        priority: 440,
        match: (ctx) => ctx.action === actions_1.Actions.PROJECT_CREATE && ['project_manager', 'office_manager', 'owner'].includes(ctx.user?.role || '')
    },
    {
        id: 'project-update-manager+',
        effect: 'allow',
        priority: 440,
        match: (ctx) => ctx.action === actions_1.Actions.PROJECT_UPDATE && ['project_manager', 'office_manager', 'owner'].includes(ctx.user?.role || '')
    },
    {
        id: 'project-delete-owner',
        effect: 'allow',
        priority: 440,
        match: (ctx) => ctx.action === actions_1.Actions.PROJECT_DELETE && ctx.user?.role === 'owner'
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
        match: (ctx) => ctx.action === actions_1.Actions.INVENTORY_TRANSACTION_CREATE && ['shop_manager', 'office_manager', 'owner'].includes(ctx.user?.role || '')
    },
    // Work order management restricted to project_manager and above (create/update)
    {
        id: 'work-order-create-manager+',
        effect: 'allow',
        priority: 425,
        match: (ctx) => ctx.action === actions_1.Actions.WORK_ORDER_CREATE && ['project_manager', 'office_manager', 'owner', 'admin'].includes(ctx.user?.role || '')
    },
    {
        id: 'work-order-update-manager+',
        effect: 'allow',
        priority: 425,
        match: (ctx) => ctx.action === actions_1.Actions.WORK_ORDER_UPDATE && ['project_manager', 'office_manager', 'owner', 'admin'].includes(ctx.user?.role || '')
    },
    // Default deny (implicit if nothing matches)
];
function evaluatePolicy(ctx) {
    const endTimer = policyEvaluationDuration.startTimer();
    try {
        for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
            try {
                if (rule.match(ctx)) {
                    if (rule.effect === 'allow')
                        return { allow: true };
                    return { allow: false, reason: `Rule ${rule.id} deny` };
                }
            }
            catch (e) {
                // ignore rule errors
            }
        }
        return { allow: false, reason: 'No matching allow rule' };
    }
    finally {
        endTimer();
    }
}
function authorize(ctx) {
    const decision = evaluatePolicy(ctx);
    const role = ctx.user?.role || 'anonymous';
    if (decision.allow) {
        (0, securityAudit_1.logSecurityEvent)(ctx.request, { action: `policy.allowed:${ctx.action}`, outcome: 'success' });
        try {
            (0, securityMetrics_1.inc)('policyAllow');
            policyDecisionCounter.inc({ action: ctx.action, outcome: 'allow', role });
        }
        catch { /* ignore */ }
    }
    else {
        (0, securityAudit_1.logSecurityEvent)(ctx.request, { action: `policy.denied:${ctx.action}`, outcome: 'denied', meta: { reason: decision.reason } });
        try {
            (0, securityMetrics_1.inc)('policyDeny');
            policyDecisionCounter.inc({ action: ctx.action, outcome: 'deny', role });
        }
        catch { /* ignore */ }
    }
    return decision;
}
function registerRule(rule) {
    rules.push(rule);
}
function listRules() {
    return rules.map(r => ({ id: r.id, effect: r.effect, priority: r.priority }));
}
