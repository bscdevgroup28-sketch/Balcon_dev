import FeatureFlag from '../models/FeatureFlag';
import { logger } from '../utils/logger';

const inMemoryCache = new Map<string, { value: boolean; ts: number }>();
const CACHE_TTL_MS = 30_000;

export async function isFeatureEnabled(key: string, context?: { userRole?: string; userId?: number }): Promise<boolean> {
  const cached = inMemoryCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const flag = await FeatureFlag.findOne({ where: { key } });
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

export async function getAllFlags(): Promise<FeatureFlag[]> {
  return FeatureFlag.findAll({ order: [['key', 'ASC']] });
}

export async function upsertFlag(data: Partial<{ key: string; enabled: boolean; description?: string; rolloutStrategy?: string; percentage?: number; audienceRoles?: string[]; metadata?: any }>) {
  if (!data.key) throw new Error('Flag key required');
  const existing = await FeatureFlag.findOne({ where: { key: data.key } });
  if (existing) {
    const rs = ((): 'boolean' | 'percentage' | 'role' => {
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
  const created = await FeatureFlag.create({
    key: data.key,
    enabled: data.enabled ?? false,
    description: data.description,
    rolloutStrategy: (data.rolloutStrategy as any) ?? 'boolean',
    percentage: data.percentage,
    audienceRoles: data.audienceRoles,
    metadata: data.metadata,
  });
  inMemoryCache.delete(data.key);
  return created;
}

export async function seedDefaultFlags() {
  const defaults: Array<Parameters<typeof upsertFlag>[0]> = [
    { key: 'prefetch.v2', enabled: true, description: 'Enable advanced panel prefetch logic', rolloutStrategy: 'boolean' },
    { key: 'feature.discovery', enabled: true, description: 'Enable Feature Discovery UI module', rolloutStrategy: 'role', audienceRoles: ['owner','project_manager','office_manager'] },
    { key: 'dashboard.experimental', enabled: false, description: 'Show experimental dashboard panels', rolloutStrategy: 'percentage', percentage: 10 },
  ];
  for (const f of defaults) {
    try { await upsertFlag(f); } catch (e) { logger.warn('Flag seed error', e); }
  }
}

export function invalidateFlag(key: string) {
  inMemoryCache.delete(key);
}
