#!/usr/bin/env node

const http = require('http');

const testEndpoint = (port, path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const testPorts = [8082, 8083];
const testPaths = ['/api', '/api/health', '/api/test'];

async function runTests() {
  console.log('🧪 Testing Phase 5B API endpoints...\n');
  
  for (const port of testPorts) {
    console.log(`📍 Testing port ${port}:`);
    
    for (const path of testPaths) {
      try {
        const result = await testEndpoint(port, path);
        console.log(`  ✅ ${path} - Status: ${result.status}`);
        if (path === '/api' && result.data) {
          try {
            const parsed = JSON.parse(result.data);
            console.log(`     📊 Version: ${parsed.version || 'Unknown'}`);
            console.log(`     🏷️  Phase: ${parsed.phase || 'Unknown'}`);
          } catch (e) {
            console.log(`     📄 Response length: ${result.data.length} chars`);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${path} - Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

runTests().catch(console.error);
