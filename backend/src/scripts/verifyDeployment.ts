// Simple deployment verification script (uses global fetch - Node 18+)
// Usage: ts-node src/scripts/verifyDeployment.ts [baseUrl]
// Default baseUrl: http://localhost:8082

async function runVerification() {
  const base = process.argv[2] || process.env.BASE_URL || 'http://localhost:8082';
  const api = (p: string) => `${base.replace(/\/$/, '')}${p}`;
  const failures: string[] = [];

  async function check(path: string, expect: number) {
    try {
      const res = await fetch(api(path), { redirect: 'manual' });
      if (res.status !== expect) {
        failures.push(`${path} expected ${expect} got ${res.status}`);
      }
      return res;
    } catch (e: any) {
      failures.push(`${path} network error: ${e.message}`);
    }
  }

  console.log(`[verify] Base URL: ${base}`);
  await check('/api/health/ready', 200); // new lightweight readiness variant
  await check('/api/health', 200); // deep health

  // Attempt login with seeded owner user (must set DEFAULT_USER_PASSWORD or TEMP password not known)
  const ownerPassword = process.env.DEFAULT_USER_PASSWORD;
  if (ownerPassword) {
    const loginRes = await fetch(api('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@balconbuilders.com', password: ownerPassword })
    });
    if (loginRes.status === 200) {
      const json: any = await loginRes.json();
      if (!json?.data?.accessToken) failures.push('login missing accessToken');
      else {
        // Try refresh flow: get cookie
        const setCookie = loginRes.headers.get('set-cookie');
        if (!setCookie) failures.push('login missing refreshToken cookie');
        else {
          const refreshRes = await fetch(api('/api/auth/refresh'), { method: 'POST', headers: { 'Cookie': setCookie } });
          if (refreshRes.status !== 200) failures.push(`refresh failed status ${refreshRes.status}`);
        }
      }
    } else {
      failures.push(`login failed status ${loginRes.status}`);
    }
  } else {
    console.log('[verify] Skipping login tests: DEFAULT_USER_PASSWORD not set');
  }

  if (failures.length) {
    console.error('[verify] FAILURES');
    failures.forEach(f => console.error(' -', f));
    process.exit(1);
  } else {
    console.log('[verify] ✅ All checks passed');
  }
}

runVerification().catch(e => { console.error('[verify] fatal', e); process.exit(1); });
