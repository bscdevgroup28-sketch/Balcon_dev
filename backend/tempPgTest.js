const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:hgacqAUfaoFLUqRkhsaIgAYYWMFYZLUB@postgres-ifto.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1');
    console.log('result', res.rows);
  } catch (err) {
    console.error('error', err);
  } finally {
    await client.end();
  }
})();
