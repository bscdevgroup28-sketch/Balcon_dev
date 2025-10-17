# Secrets Rotation Procedure

## Scope
JWT access & refresh secrets, email/Twilio credentials, storage keys, METRICS_AUTH_TOKEN, database credentials.

## Principles
- Never edit secrets directly in code.
- Staged overlap period for token secrets (accept both old & new for refresh window) if implementing dual-key logic later.
- Record rotation date & next scheduled date.

## Rotation Cadence
| Secret | Frequency | Notes |
|--------|-----------|-------|
| JWT_ACCESS_SECRET | 90 days | Short TTL tokens mitigate risk |
| JWT_REFRESH_SECRET | 90 days | Requires invalidation of existing refresh tokens or dual validation window |
| METRICS_AUTH_TOKEN | 180 days | Low exposure scope |
| SMTP / Email | 180 days | Align with provider policy |
| S3 / Storage Keys | 180 days | Prefer IAM role with limited lifetime |
| DB Password | 180–365 days | Coordinate with connection pool restart |

## Procedure (JWT Secrets)
1. Generate new secret (32+ random bytes base64).
2. (Optional advanced) Deploy with NEW_SECRET alongside OLD_SECRET, code validates either during grace period.
3. Invalidate outstanding refresh tokens (or allow natural expiry if acceptable risk) and revoke sessions if high-risk event triggered rotation.
4. Remove OLD_SECRET after grace window.
5. Log rotation event with requestId & operator.

## Procedure (DB Credentials)
1. Create new DB user with same grants.
2. Update `DATABASE_URL` in staging -> deploy -> smoke tests.
3. Update production `DATABASE_URL` -> deploy new containers -> confirm healthy.
4. Drop old user after verification delay (24h).

## Emergency Rotation
If compromise suspected:
- Immediately revoke affected credentials.
- Force password reset for users if auth key leakage.
- Invalidate all refresh tokens and require re-login.

## Logging
Record rotation events in an internal runbook or secure audit system:
```
Date | Secret | Operator | Method | Notes
```

## Future Enhancements
- Dual-key JWT validation logic.
- Automated reminder script scanning last rotation dates.
