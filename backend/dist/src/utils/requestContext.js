"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithRequestContext = runWithRequestContext;
exports.getRequestContext = getRequestContext;
exports.requestContextMiddleware = requestContextMiddleware;
const async_hooks_1 = require("async_hooks");
const store = new async_hooks_1.AsyncLocalStorage();
function runWithRequestContext(ctx, fn) {
    store.run(ctx, fn);
}
function getRequestContext() {
    return store.getStore();
}
// Express middleware to initialize context; should be placed early (after requestId assignment)
function requestContextMiddleware(req, _res, next) {
    const ctx = { requestId: req.requestId, userId: req.user?.id, role: req.user?.role };
    runWithRequestContext(ctx, () => next());
}
