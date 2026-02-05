/**
 * Combined starter for DataShark Backend + Beta Model
 * Runs both services in the same Render Web Service
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 DataShark - Starting backend and beta model...\n');

// Paths
const backendDir = path.join(__dirname, 'mini-lemonade/backend');
const betaDir = path.join(__dirname, 'mini-lemonade/ai-beta');

// Function to start backend
function startBackend() {
  console.log('📊 Starting backend Node.js on port 3000...');
  
  const backend = spawn('node', ['src/index.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  backend.on('error', (err) => {
    console.error('❌ Backend error:', err);
    process.exit(1);
  });

  backend.on('exit', (code) => {
    console.error(`❌ Backend exited with code ${code}`);
    process.exit(1);
  });

  return backend;
}

// Function to start beta model
function startBetaModel() {
  console.log('🤖 Starting beta model Python on port 8000...');
  
  const env = { ...process.env };
  // Let server.py use default model path (model.pt in same directory)
  // env.BETA_MODEL_PATH can be overridden via environment variable if needed
  env.PYTHONUNBUFFERED = '1';

  const beta = spawn('python', ['-m', 'uvicorn', 'server:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: betaDir,
    stdio: 'inherit',
    shell: true,
    env: env
  });

  beta.on('error', (err) => {
    console.error('❌ Beta model error:', err);
    process.exit(1);
  });

  beta.on('exit', (code) => {
    console.error(`❌ Beta model exited with code ${code}`);
    process.exit(1);
  });

  return beta;
}

// Start both services
console.log('Starting services in 2 seconds...\n');
setTimeout(() => {
  const backend = startBackend();
  const beta = startBetaModel();

  console.log('\n✅ Services started:');
  console.log('   Backend (Node.js): http://localhost:3000');
  console.log('   Beta Model (Python): http://localhost:8000\n');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n📛 Shutting down...');
    backend.kill('SIGTERM');
    beta.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n📛 Shutting down...');
    backend.kill('SIGINT');
    beta.kill('SIGINT');
    process.exit(0);
  });
}, 2000);
