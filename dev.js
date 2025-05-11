// dev.js - Script to run both frontend and backend services
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  frontend: '\x1b[36m', // Cyan
  express: '\x1b[32m',  // Green
  fastapi: '\x1b[35m',  // Magenta
  reset: '\x1b[0m'      // Reset
};

console.log('Starting development servers...');

// Start Next.js frontend
const frontend = spawn('pnpm', ['dev'], {
  stdio: 'pipe',
  shell: true
});

// Log frontend output
frontend.stdout.on('data', (data) => {
  console.log(`${colors.frontend}[Frontend] ${data.toString().trim()}${colors.reset}`);
});
frontend.stderr.on('data', (data) => {
  console.error(`${colors.frontend}[Frontend Error] ${data.toString().trim()}${colors.reset}`);
});

// Start Express backend
const express = spawn('node', ['backend/server.js'], {
  stdio: 'pipe',
  shell: true
});

// Log Express output
express.stdout.on('data', (data) => {
  console.log(`${colors.express}[Express] ${data.toString().trim()}${colors.reset}`);
});
express.stderr.on('data', (data) => {
  console.error(`${colors.express}[Express Error] ${data.toString().trim()}${colors.reset}`);
});

// Start FastAPI backend
const fastapi = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload'], {
  stdio: 'pipe',
  shell: true,
  cwd: path.join(process.cwd(), 'backend', 'fastapi_server')
});

// Log FastAPI output
fastapi.stdout.on('data', (data) => {
  console.log(`${colors.fastapi}[FastAPI] ${data.toString().trim()}${colors.reset}`);
});
fastapi.stderr.on('data', (data) => {
  console.error(`${colors.fastapi}[FastAPI Error] ${data.toString().trim()}${colors.reset}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all servers...');
  frontend.kill();
  express.kill();
  fastapi.kill();
  process.exit();
});

// Log process exit
frontend.on('close', (code) => {
  console.log(`${colors.frontend}[Frontend] process exited with code ${code}${colors.reset}`);
});
express.on('close', (code) => {
  console.log(`${colors.express}[Express] process exited with code ${code}${colors.reset}`);
});
fastapi.on('close', (code) => {
  console.log(`${colors.fastapi}[FastAPI] process exited with code ${code}${colors.reset}`);
});
