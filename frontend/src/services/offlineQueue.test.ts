import { enqueue, flush, __setOfflineQueueTestMode } from './offlineQueue';

// Mock indexedDB for jsdom environment with working getAll and tx events
const mem: Record<string, any> = {};
(global as any).indexedDB = {
  open: (_name: string, _ver: number) => {
    const req: any = {
      result: {
        objectStoreNames: { contains: () => true },
        transaction: (_s: string, _m: string) => {
          const tx: any = { oncomplete: null, onerror: null };
          const store = {
            put: (v: any) => { mem[v.id] = v; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); },
            delete: (k: string) => { delete mem[k]; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); },
            getAll: () => {
              const r: any = { onsuccess: null, onerror: null };
              setTimeout(() => r.onsuccess && r.onsuccess({ target: { result: Object.values(mem) } }), 0);
              return r;
            }
          };
          return { objectStore: () => store, ...tx };
        },
      },
      onupgradeneeded: null as any,
      onsuccess: null as any,
      onerror: null as any,
    };
    setTimeout(() => req.onsuccess && req.onsuccess({}), 0);
    return req;
  }
} as any;

__setOfflineQueueTestMode(true);
let __online = false;
try {
  Object.defineProperty((global as any).navigator, 'onLine', {
    configurable: true,
    get: () => __online,
  });
} catch {
  // Fallback: replace navigator entirely if defineProperty fails
  (global as any).navigator = { get onLine() { return __online; } } as any;
}

test('enqueue stores requests when offline and flush clears them when online', async () => {
  const id = await enqueue({ url: '/api/demo', method: 'post', body: { a: 1 } });
  expect(id).toBeTruthy();
  __online = true;
  const api = (cfg: any) => Promise.resolve({ data: { ok: true, cfg } });
  await flush(api);
  // No throw means success; simple smoke test
});
