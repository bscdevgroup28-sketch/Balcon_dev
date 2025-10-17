import { createClient, RedisClientType } from 'redis';
import { metrics } from '../monitoring/metrics';

interface Options { prefix?: string }

export class RedisCache {
  private client: RedisClientType;
  private prefix: string;
  private ready = false;
  constructor(url: string, opts: Options = {}) {
    this.client = createClient({ url });
    this.prefix = opts.prefix || 'balcon';
    this.client.on('error', () => { /* swallow for now */ });
    this.client.connect().then(()=>{ this.ready = true; }).catch(()=>{});
  }
  private k(key: string) { return `${this.prefix}:cache:${key}`; }
  async get<T=any>(key: string): Promise<T | undefined> {
    if (!this.ready) return undefined;
    const raw = await this.client.get(this.k(key));
    if (!raw) { metrics.increment('cache.miss'); return undefined; }
    try { const parsed = JSON.parse(raw); metrics.increment('cache.hit'); return parsed.v as T; } catch { return undefined; }
  }
  async set<T=any>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!this.ready) return; await this.client.set(this.k(key), JSON.stringify({ v: value }), { PX: ttlMs }); metrics.increment('cache.set'); }
  async del(key: string) { if (!this.ready) return; await this.client.del(this.k(key)); metrics.increment('cache.invalidate'); }
}

let _redisInstance: RedisCache | null = null;
export function getRedisCache(): RedisCache | null {
  if (!_redisInstance && process.env.REDIS_URL) {
    _redisInstance = new RedisCache(process.env.REDIS_URL);
  }
  return _redisInstance;
}
