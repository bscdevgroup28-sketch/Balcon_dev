import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId?: string;
  userId?: string | number;
  role?: string;
}

const store = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext(ctx: RequestContext, fn: () => void) {
  store.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return store.getStore();
}

// Express middleware to initialize context; should be placed early (after requestId assignment)
export function requestContextMiddleware(req: any, _res: any, next: any) {
  const ctx: RequestContext = { requestId: req.requestId, userId: req.user?.id, role: req.user?.role };
  runWithRequestContext(ctx, () => next());
}
