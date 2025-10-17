"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
exports.getRedisCache = getRedisCache;
const redis_1 = require("redis");
const metrics_1 = require("../monitoring/metrics");
class RedisCache {
    constructor(url, opts = {}) {
        this.ready = false;
        this.client = (0, redis_1.createClient)({ url });
        this.prefix = opts.prefix || 'balcon';
        this.client.on('error', () => { });
        this.client.connect().then(() => { this.ready = true; }).catch(() => { });
    }
    k(key) { return `${this.prefix}:cache:${key}`; }
    async get(key) {
        if (!this.ready)
            return undefined;
        const raw = await this.client.get(this.k(key));
        if (!raw) {
            metrics_1.metrics.increment('cache.miss');
            return undefined;
        }
        try {
            const parsed = JSON.parse(raw);
            metrics_1.metrics.increment('cache.hit');
            return parsed.v;
        }
        catch {
            return undefined;
        }
    }
    async set(key, value, ttlMs) {
        if (!this.ready)
            return;
        await this.client.set(this.k(key), JSON.stringify({ v: value }), { PX: ttlMs });
        metrics_1.metrics.increment('cache.set');
    }
    async del(key) { if (!this.ready)
        return; await this.client.del(this.k(key)); metrics_1.metrics.increment('cache.invalidate'); }
}
exports.RedisCache = RedisCache;
let _redisInstance = null;
function getRedisCache() {
    if (!_redisInstance && process.env.REDIS_URL) {
        _redisInstance = new RedisCache(process.env.REDIS_URL);
    }
    return _redisInstance;
}
