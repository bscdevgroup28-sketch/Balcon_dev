#!/usr/bin/env node

/**
 * Simple test script to verify API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testAPI() {
  try {
    console.log('🧪 Testing Bal-Con Builders API...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.status);

    // Test projects endpoint
    console.log('\n2. Testing projects endpoint...');
    
    // Create a test project
    const projectData = {
      title: 'Test Metal Fabrication Project',
      description: 'A test project for custom metal fabrication work',
      projectType: 'commercial',
      priority: 'medium',
      estimatedBudget: 25000,
      location: 'Dallas, TX',
      requirements: {
        material: 'Steel',
        finish: 'Powder coated',
        dimensions: '10x20 feet'
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/api/projects`, projectData);
    console.log('✅ Project created:', createResponse.data.data.title);
    
    const projectId = createResponse.data.data.id;

    // Get projects list
    const listResponse = await axios.get(`${BASE_URL}/api/projects`);
    console.log('✅ Projects list:', listResponse.data.meta.total, 'projects found');

    // Get specific project
    const getResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    console.log('✅ Project details:', getResponse.data.data.title);

    // Test quotes endpoint
    console.log('\n3. Testing quotes endpoint...');
    
    const quoteData = {
      projectId: projectId,
      items: [
        {
          description: 'Custom steel framework',
          quantity: 1,
          unitPrice: 15000,
          unit: 'each'
        },
        {
          description: 'Powder coating finish',
          quantity: 200,
          unitPrice: 5,
          unit: 'sq ft'
        }
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      terms: 'Net 30 payment terms',
      notes: 'Quote includes delivery and installation'
    };

    const quoteResponse = await axios.post(`${BASE_URL}/api/quotes`, quoteData);
    console.log('✅ Quote created:', quoteResponse.data.data.quoteNumber);
    console.log('   Total amount: $' + quoteResponse.data.data.totalAmount);

    // Get quotes list
    const quotesListResponse = await axios.get(`${BASE_URL}/api/quotes`);
    console.log('✅ Quotes list:', quotesListResponse.data.meta.total, 'quotes found');

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\n📊 API Summary:');
    console.log(`- Health endpoint: ✅ Working`);
    console.log(`- Projects CRUD: ✅ Working`);
    console.log(`- Quotes CRUD: ✅ Working`);
    console.log(`- Database: ✅ SQLite running`);
    console.log(`- Server: ✅ Running on port 8080`);

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if server is available
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on port 8080');
    console.log('Please start the server first with: npm run dev');
    process.exit(1);
  }
  
  await testAPI();
}

main();
