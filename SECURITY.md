# Security

This document outlines the security measures and best practices for the BalCon platform.

## Threat Model

### Assets
- User data (projects, orders, materials)
- Authentication tokens (JWT)
- Export files and tokens
- Webhook secrets and payloads
- Database (SQLite dev/test, PostgreSQL prod)

### Threats
- Unauthorized access via weak auth
- Data leakage through exports/webhooks
- Injection attacks (SQL, NoSQL)
- Denial of service (rate limiting bypass)
- Man-in-the-middle on webhooks
- Credential stuffing/brute force

### Mitigations
- JWT authentication with role-based access
- Rate limiting (in-memory + Redis atomic counters)
- Input validation and sanitization
- HMAC signatures on webhooks
- One-time download tokens for exports
- Helmet security headers
- Audit logging for security events

## Authentication & Authorization

### JWT Tokens
- Issued on login with 1h expiration
- Refresh tokens for session extension
- Role-based permissions (Owner, Admin, etc.)
- Secure storage in httpOnly cookies (access + refresh), cleared on logout; server also supports Authorization header fallback

### Rate Limiting
- Per-user/IP limits on sensitive endpoints
- Metrics: ratelimit.allowed / ratelimit.blocked
- Redis-backed for distributed enforcement

## Data Protection
### File Handling
- Upload MIME allowlist (images, PDFs, office docs, CAD, text/CSV) and size limits
- Downloads set `X-Content-Type-Options: nosniff`; non-images served as attachments
- Future: granular access control on private files

### Exports
- Files stored locally or S3 with presigned URLs
- One-time download tokens (TTL 10m-1h)
- No permanent public URLs
- Compression optional (gzip)

### Webhooks
- HMAC SHA256 signature verification
- Secret rotation endpoint
- Retry with exponential backoff
- Failure tracking and manual retry

## Secure Coding Practices

- Input validation with Zod schemas
- SQL injection prevention via Sequelize
- XSS protection via React sanitization
- CSRF tokens for forms (future)
- Dependency scanning (npm audit)

## Incident Response

- Log security events to database
- Monitor metrics for anomalies
- Rotate secrets on compromise
- Backup and recovery procedures

## Compliance

- GDPR considerations for EU users
- Data retention policies
- Right to erasure implementation

## Contact

For security issues, contact the development team internally.