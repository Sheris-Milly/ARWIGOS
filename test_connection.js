/**
 * Test script to verify the connection between frontend and backend
 * Run this with Node.js to test the connection
 */

const fetch = require('node-fetch');
const config = require('./config');

/**
 * Test the connection to the backend
 */
async function testBackendConnection() {
  console.log('\n=== Testing Backend Connection ===');
  
  try {
    // Test the health endpoint
    console.log(`Testing connection to: ${config.backend.baseUrl}${config.backend.endpoints.health}`);
    const response = await fetch(`${config.backend.baseUrl}${config.backend.endpoints.health}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connection successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ Backend connection failed!');
      console.log(`Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Backend connection failed!');
    console.log(`Error: ${error.message}`);
    console.log('\nPossible reasons:');
    console.log('1. The backend server is not running');
    console.log('2. The backend server is running on a different port');
    console.log('3. There is a network issue');
    
    console.log('\nTry running the backend server with:');
    console.log('python start_backend.py');
  }
  
  console.log('\n=== Connection Test Complete ===');
}

// Run the test
testBackendConnection();
