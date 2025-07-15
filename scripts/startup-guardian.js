#!/usr/bin/env node

/**
 * Startup Guardian Script
 * Comprehensive pre-startup validation and auto-repair system
 */

import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { preDevCheck } from './pre-dev-check.js';
import { firebaseHealthCheck } from './firebase-health-check.js';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function createEnvironmentFile() {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    log('Creating .env file with default values...');
    
    const defaultEnv = `# Firebase Configuration (Optional - will use mock data if not provided)
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=cedoi-forum.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cedoi-forum-demo
VITE_FIREBASE_STORAGE_BUCKET=cedoi-forum-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Development Options
VITE_USE_FIREBASE_EMULATOR=false
NODE_ENV=development
`;
    
    writeFileSync(envPath, defaultEnv);
    log('.env file created with default configuration');
  }
}

function createHealthCheckMonitor() {
  log('Setting up continuous health monitoring...');
  
  // Create a monitor that runs periodically
  const monitorScript = `#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';

const MONITORING_INTERVAL = 30000; // 30 seconds
const CRITICAL_PATHS = [
  'node_modules/firebase',
  'node_modules/react',
  'node_modules/express',
  'node_modules/vite'
];

function checkCriticalPaths() {
  const missing = CRITICAL_PATHS.filter(path => !existsSync(join(process.cwd(), path)));
  
  if (missing.length > 0) {
    console.log('⚠️ Critical dependencies missing:', missing.join(', '));
    console.log('🔧 Consider running: npm install');
    return false;
  }
  
  return true;
}

function startMonitoring() {
  console.log('🔍 Starting dependency monitoring...');
  
  setInterval(() => {
    checkCriticalPaths();
  }, MONITORING_INTERVAL);
  
  // Initial check
  checkCriticalPaths();
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  startMonitoring();
}
`;
  
  const monitorPath = join(process.cwd(), 'scripts', 'dependency-monitor.js');
  writeFileSync(monitorPath, monitorScript);
  log('Dependency monitor created');
}

function runPreflightChecks() {
  log('Running preflight checks...');
  
  return new Promise((resolve) => {
    const checks = [
      preDevCheck,
      firebaseHealthCheck
    ];
    
    let allPassed = true;
    
    const runNextCheck = (index) => {
      if (index >= checks.length) {
        resolve(allPassed);
        return;
      }
      
      try {
        const result = checks[index]();
        if (!result) {
          allPassed = false;
        }
      } catch (error) {
        log(`Check ${index} failed: ${error.message}`, 'error');
        allPassed = false;
      }
      
      runNextCheck(index + 1);
    };
    
    runNextCheck(0);
  });
}

function startDevelopmentServer() {
  log('Starting development server...');
  
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  serverProcess.on('error', (error) => {
    log(`Server process error: ${error.message}`, 'error');
  });
  
  serverProcess.on('close', (code) => {
    log(`Server process exited with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down development server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Shutting down development server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  return serverProcess;
}

async function main() {
  console.log('🛡️  Startup Guardian Activated\n');
  
  // Step 1: Create environment file if needed
  createEnvironmentFile();
  
  // Step 2: Set up monitoring
  createHealthCheckMonitor();
  
  // Step 3: Run comprehensive checks
  const preflightPassed = await runPreflightChecks();
  
  if (!preflightPassed) {
    log('Preflight checks failed', 'error');
    console.log('\n💡 Manual steps to resolve:');
    console.log('  1. Run: npm install');
    console.log('  2. Run: npm run check:deps');
    console.log('  3. Try starting again');
    process.exit(1);
  }
  
  // Step 4: Start development server
  console.log('\n🚀 All checks passed! Starting development server...\n');
  startDevelopmentServer();
}

// Run the guardian
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main().catch((error) => {
    log(\`Guardian failed: \${error.message}\`, 'error');
    process.exit(1);
  });
}