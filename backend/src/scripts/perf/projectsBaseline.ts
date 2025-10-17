import autocannon from 'autocannon';

async function run() {
  const target = process.env.BASE_URL || 'http://localhost:8082';
  const url = `${target}/api/projects`;
  console.log(`[perf] Running projects baseline against ${url}`);
  const token = process.env.PERF_ACCESS_TOKEN; // Provide a valid access token externally
  if (!token) {
    console.error('PERF_ACCESS_TOKEN env var required for projects baseline');
    process.exit(1);
  }
  const result = await autocannon({
    url,
    connections: Number(process.env.PERF_CONN || 10),
    duration: Number(process.env.PERF_DURATION || 15),
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const { latency, requests } = result as any;
  const summary = {
    scenario: 'projects.list',
    p50: latency.p50,
    p95: latency.p95,
    rpsAvg: requests.average,
    rpsP95: requests.p95,
    duration: result.duration,
    connections: result.connections
  };
  console.log('[perf] summary', summary);
  console.log(JSON.stringify(summary, null, 2));
}
run().catch(e => { console.error(e); process.exit(1); });
