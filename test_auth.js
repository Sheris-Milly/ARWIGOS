/**
 * Test authentication between frontend and backend
 * This script will make requests to the backend with different authentication tokens
 * and print the results to help diagnose authentication issues.
 */

const fetch = require('node-fetch');

// Backend URL
const BACKEND_URL = 'http://localhost:8000';

// Test tokens
const tokens = {
  dev: 'dev-mode-token',
  empty: '',
  invalid: 'invalid-token-123',
};

/**
 * Test authentication with a specific token
 * @param {string} tokenName - Name of the token being tested
 * @param {string} token - The token to test
 */
async function testAuth(tokenName, token) {
  console.log(`\n=== Testing authentication with ${tokenName} token ===`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const status = response.status;
    let body;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }
    
    console.log(`Status: ${status}`);
    console.log(`Response: ${JSON.stringify(body)}`);
    
    if (response.ok) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed!');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

/**
 * Test a chat request with the development token
 */
async function testChatWithDevToken() {
  console.log('\n=== Testing chat endpoint with dev token ===');
  
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.dev}`
      },
      body: JSON.stringify({
        message: 'Hello, this is a test message',
        conversation_id: null,
        context: {
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const status = response.status;
    console.log(`Status: ${status}`);
    
    if (response.ok) {
      const body = await response.json();
      console.log('✅ Chat request successful!');
      console.log(`Response: ${JSON.stringify(body, null, 2).substring(0, 200)}...`); // Show just the beginning
    } else {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = { detail: response.statusText };
      }
      console.log('❌ Chat request failed!');
      console.log(`Error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Authentication Test Script ===');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('\nRunning authentication tests...');
  
  // Test each token
  for (const [name, token] of Object.entries(tokens)) {
    await testAuth(name, token);
  }
  
  // Test chat endpoint
  await testChatWithDevToken();
  
  console.log('\n=== Tests completed ===');
}

// Run the tests
runTests();
