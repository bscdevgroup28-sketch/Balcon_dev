/*
  Offline Mutation Queue for Step 8
  - Minimal IndexedDB wrapper via idb-keyval-like approach (no external dep)
  - Exposes enqueue, flush, getQueue, onStatusChange
  - Integrates with axios instance (caller) by posting stored requests when online
*/
export type QueuedRequest = {
  id: string;                 // client-generated UUID
  url: string;                // relative API path e.g. /api/orders
  method: 'post'|'put'|'patch'|'delete';
  body?: any;
  headers?: Record<string,string>;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

type Listener = (status: { online: boolean; pending: number; flushing: boolean }) => void;

const DB_NAME = 'balcon_offline_queue_v1';
const STORE = 'queue';

let dbPromise: Promise<IDBDatabase> | null = null;
let listeners: Listener[] = [];
let flushing = false;
let TEST_MEMORY_MODE = false;
const __memStore: Record<string, QueuedRequest> = {};

// Test helper to bypass IndexedDB with an in-memory store
export function __setOfflineQueueTestMode(enabled: boolean) {
  TEST_MEMORY_MODE = enabled;
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function put(item: QueuedRequest) {
  if (TEST_MEMORY_MODE) {
    __memStore[item.id] = item;
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function del(id: string) {
  if (TEST_MEMORY_MODE) {
    delete __memStore[id];
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function all(): Promise<QueuedRequest[]> {
  if (TEST_MEMORY_MODE) {
    return Object.values(__memStore);
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueuedRequest[]);
    req.onerror = () => reject(req.error);
  });
}

function notify() {
  const status = { online: navigator.onLine, pending: _pending, flushing };
  listeners.forEach(l => {
    try { l(status); } catch { /* ignore listener errors */ }
  });
}

let _pending = 0;
async function refreshPending() {
  try {
    const q = await all();
    _pending = q.length;
  } catch {
    _pending = 0;
  }
  notify();
}

export function onStatusChange(listener: Listener) {
  listeners.push(listener);
  listener({ online: navigator.onLine, pending: _pending, flushing });
  return () => { listeners = listeners.filter(l => l !== listener); };
}

export async function enqueue(req: Omit<QueuedRequest,'id'|'createdAt'|'attempts'>) {
  const id = crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2);
  const item: QueuedRequest = { id, createdAt: Date.now(), attempts: 0, ...req };
  await put(item);
  await refreshPending();
  return item.id;
}

async function perform(api: any, item: QueuedRequest) {
  const cfg: any = { method: item.method, url: item.url, data: item.body };
  if (item.headers) cfg.headers = item.headers;
  return api(cfg);
}

export async function flush(api: any, opts: { maxAttempts?: number } = {}) {
  if (flushing) return; // prevent concurrent flushes
  flushing = true; notify();
  try {
    const maxAttempts = Math.max(1, opts.maxAttempts ?? 5);
    const items = (await all()).sort((a,b)=>a.createdAt - b.createdAt);
    for (const it of items) {
      if (!navigator.onLine) break;
      try {
        await perform(api, it);
        await del(it.id);
      } catch (e:any) {
        const status = e?.response?.status;
        // If 4xx other than 429, drop (client error likely permanent)
        if (status && status >= 400 && status < 500 && status !== 429) {
          await del(it.id);
          continue;
        }
        it.attempts += 1;
        it.lastError = e?.message || 'unknown';
        if (it.attempts >= maxAttempts) {
          // give up permanently
          await del(it.id);
          continue;
        }
        await put(it); // save attempts/error
      }
    }
  } finally {
    flushing = false;
    await refreshPending();
  }
}

// Auto-flush on reconnect
window.addEventListener('online', () => notify());
window.addEventListener('offline', () => notify());

// Initial pending count
refreshPending();
