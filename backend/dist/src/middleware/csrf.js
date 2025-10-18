"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueCsrfToken = issueCsrfToken;
exports.csrfIssueHandler = csrfIssueHandler;
exports.csrfProtect = csrfProtect;
const crypto_1 = __importDefault(require("crypto"));
const TOKEN_COOKIE = 'csrfToken';
const HEADER_NAME = 'x-csrf-token';
// Routes that are public and should bypass CSRF (tokenized workflows etc.)
const CSRF_BYPASS = [
    /^\/api\/approvals\//i,
    /^\/api\/public\//i,
];
function issueCsrfToken(req, res) {
    // If cookie exists and is plausible, reuse; else create a new one
    let token = req.cookies?.[TOKEN_COOKIE];
    if (!token || typeof token !== 'string' || token.length < 16) {
        token = crypto_1.default.randomBytes(24).toString('hex');
    }
    res.cookie(TOKEN_COOKIE, token, {
        httpOnly: false, // readable by client JS for double-submit
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });
    return token;
}
function csrfIssueHandler(req, res) {
    const token = issueCsrfToken(req, res);
    res.json({ ok: true, csrfToken: token });
}
function csrfProtect(req, res, next) {
    // Only enforce for unsafe methods
    const method = (req.method || 'GET').toUpperCase();
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!unsafe)
        return next();
    // Skip bypass routes
    const path = req.path || req.originalUrl || '';
    if (CSRF_BYPASS.some(re => re.test(path)))
        return next();
    // Require token in header matching cookie (double-submit)
    const cookieToken = req.cookies?.[TOKEN_COOKIE];
    const headerToken = req.headers[HEADER_NAME] || req.headers[HEADER_NAME.toUpperCase()];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ ok: false, error: 'CSRF token missing or invalid' });
    }
    return next();
}
