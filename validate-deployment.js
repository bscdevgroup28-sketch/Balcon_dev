#!/usr/bin/env node

/**
 * Railway Deployment Validation Script
 * Checks if the application is ready for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Deployment Readiness Check\n');

const checks = [
  {
    name: 'Backend package.json has build script',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.build && pkg.scripts.start;
    }
  },
  {
    name: 'Frontend package.json has build script',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('./frontend/package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.build;
    }
  },
  {
    name: 'Railway config files exist',
    check: () => {
      return fs.existsSync('./railway.json') && 
             fs.existsSync('./backend/railway.json') && 
             fs.existsSync('./frontend/railway.json');
    }
  },
  {
    name: 'GitHub Actions workflows exist',
    check: () => {
      return fs.existsSync('./.github/workflows/backend.yml') &&
             fs.existsSync('./.github/workflows/frontend.yml');
    }
  },
  {
    name: 'PostgreSQL dependency included',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
      return pkg.dependencies && pkg.dependencies.pg;
    }
  },
  {
    name: 'Environment config supports DATABASE_URL',
    check: () => {
      const envConfig = fs.readFileSync('./backend/src/config/environment.ts', 'utf8');
      return envConfig.includes('DATABASE_URL');
    }
  },
  {
    name: 'Database config supports PostgreSQL',
    check: () => {
      const dbConfig = fs.readFileSync('./backend/src/config/database.ts', 'utf8');
      return dbConfig.includes('postgres') && dbConfig.includes('ssl');
    }
  },
  {
    name: 'Health check endpoint exists',
    check: () => {
      const healthFile = './backend/src/routes/health.ts';
      return fs.existsSync(healthFile);
    }
  },
  {
    name: 'README and documentation exist',
    check: () => {
      return fs.existsSync('./README.md') && 
             fs.existsSync('./RAILWAY_DEPLOYMENT.md') &&
             fs.existsSync('./DEPLOYMENT_SETUP.md');
    }
  },
  {
    name: '.gitignore configured',
    check: () => {
      const gitignore = fs.readFileSync('./.gitignore', 'utf8');
      return gitignore.includes('node_modules') && 
             gitignore.includes('.env') &&
             gitignore.includes('build/');
    }
  }
];

let passed = 0;
const total = checks.length;

checks.forEach((check, index) => {
  try {
    const result = check.check();
    if (result) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
    }
  } catch (error) {
    console.log(`❌ ${check.name} (Error: ${error.message})`);
  }
});

console.log(`\n📊 Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n🎉 All checks passed! Ready for Railway deployment.');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub: git push origin main');
  console.log('2. Set up Railway project from GitHub repo');
  console.log('3. Configure environment variables in Railway');
  console.log('4. Test deployment endpoints');
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.');
  console.log('\nNote: Frontend test failures won\'t prevent deployment,');
  console.log('but should be fixed before production use.');
}
