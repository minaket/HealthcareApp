const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Healthcare App Backend Server...');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
const fs = require('fs');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

// Start the server
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
}); 