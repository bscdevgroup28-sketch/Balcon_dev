"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFeatureEnabled = isFeatureEnabled;
exports.getAllFlags = getAllFlags;
exports.upsertFlag = upsertFlag;
exports.seedDefaultFlags = seedDefaultFlags;
exports.invalidateFlag = invalidateFlag;
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const logger_1 = require("../utils/logger");
const inMemoryCache = new Map();
const CACHE_TTL_MS = 30000;
async function isFeatureEnabled(key, context) {
    const cached = inMemoryCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS)
        return cached.value;
    const flag = await FeatureFlag_1.default.findOne({ where: { key } });
    if (!flag) {
        inMemoryCache.set(key, { value: false, ts: Date.now() });
        return false;
    }
    let result = flag.enabled;
    if (result) {
        switch (flag.rolloutStrategy) {
            case 'percentage':
                if (typeof flag.percentage === 'number') {
                    const hashSource = `${context?.userId ?? 0}-${key}`;
                    let hash = 0;
                    for (let i = 0; i < hashSource.length; i++) {
                        hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
                    }
                    const bucket = hash % 100;
                    result = bucket < flag.percentage;
                }
                break;
            case 'role':
                if (Array.isArray(flag.audienceRoles) && context?.userRole) {
                    result = flag.audienceRoles.includes(context.userRole);
                }
                break;
            default:
                break;
        }
    }
    inMemoryCache.set(key, { value: result, ts: Date.now() });
    return result;
}
async function getAllFlags() {
    return FeatureFlag_1.default.findAll({ order: [['key', 'ASC']] });
}
async function upsertFlag(data) {
    if (!data.key)
        throw new Error('Flag key required');
    const existing = await FeatureFlag_1.default.findOne({ where: { key: data.key } });
    if (existing) {
        const rs = (() => {
            const v = data.rolloutStrategy;
            return v === 'percentage' || v === 'role' ? v : 'boolean';
        })();
        await existing.update({
            enabled: data.enabled ?? existing.enabled,
            description: data.description ?? existing.description,
            rolloutStrategy: rs ?? existing.rolloutStrategy,
            percentage: data.percentage ?? existing.percentage,
            audienceRoles: data.audienceRoles ?? existing.audienceRoles,
            metadata: data.metadata ?? existing.metadata,
        });
        inMemoryCache.delete(data.key);
        return existing;
    }
    const created = await FeatureFlag_1.default.create({
        key: data.key,
        enabled: data.enabled ?? false,
        description: data.description,
        rolloutStrategy: data.rolloutStrategy ?? 'boolean',
        percentage: data.percentage,
        audienceRoles: data.audienceRoles,
        metadata: data.metadata,
    });
    inMemoryCache.delete(data.key);
    return created;
}
async function seedDefaultFlags() {
    const defaults = [
        { key: 'prefetch.v2', enabled: true, description: 'Enable advanced panel prefetch logic', rolloutStrategy: 'boolean' },
        { key: 'feature.discovery', enabled: true, description: 'Enable Feature Discovery UI module', rolloutStrategy: 'role', audienceRoles: ['owner', 'project_manager', 'office_manager'] },
        { key: 'dashboard.experimental', enabled: false, description: 'Show experimental dashboard panels', rolloutStrategy: 'percentage', percentage: 10 },
    ];
    for (const f of defaults) {
        try {
            await upsertFlag(f);
        }
        catch (e) {
            logger_1.logger.warn('Flag seed error', e);
        }
    }
}
function invalidateFlag(key) {
    inMemoryCache.delete(key);
}
