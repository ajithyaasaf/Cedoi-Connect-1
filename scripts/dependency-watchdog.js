#!/usr/bin/env node

/**
 * Dependency Watchdog
 * Real-time monitoring and auto-repair system
 */

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { watch } from 'fs';

export class DependencyWatchdog {
  constructor() {
    this.isWatching = false;
    this.watchTimers = new Map();
    this.repairInProgress = false;
    this.criticalPaths = [
      'node_modules/firebase',
      'node_modules/react',
      'node_modules/react-dom',
      'node_modules/express',
      'node_modules/vite',
      'node_modules/@tanstack/react-query',
      'node_modules/wouter'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [WATCHDOG ${timestamp}] ${message}`);
  }

  checkCriticalPaths() {
    const missing = this.criticalPaths.filter(path => 
      !existsSync(join(process.cwd(), path))
    );
    
    if (missing.length > 0) {
      this.log(`Critical dependencies missing: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    return true;
  }

  checkFirebaseIntegrity() {
    const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
    
    if (!existsSync(firebasePath)) {
      this.log('Firebase package missing', 'error');
      return false;
    }
    
    // Check critical Firebase files
    const criticalFiles = [
      'package.json',
      'app/dist/index.js',
      'firestore/dist/index.js',
      'auth/dist/index.js'
    ];
    
    const missingFiles = criticalFiles.filter(file => 
      !existsSync(join(firebasePath, file))
    );
    
    if (missingFiles.length > 0) {
      this.log(`Firebase files missing: ${missingFiles.join(', ')}`, 'error');
      return false;
    }
    
    return true;
  }

  async autoRepair() {
    if (this.repairInProgress) {
      this.log('Repair already in progress', 'warning');
      return false;
    }
    
    this.repairInProgress = true;
    this.log('Starting auto-repair...');
    
    try {
      // Clear npm cache
      this.log('Clearing npm cache...');
      execSync('npm cache clean --force', { stdio: 'pipe' });
      
      // Reinstall Firebase specifically
      this.log('Reinstalling Firebase...');
      execSync('npm uninstall firebase', { stdio: 'pipe' });
      execSync('npm install firebase@latest', { stdio: 'pipe' });
      
      // Verify repair
      const repairSuccess = this.checkCriticalPaths() && this.checkFirebaseIntegrity();
      
      if (repairSuccess) {
        this.log('Auto-repair completed successfully');
        return true;
      } else {
        this.log('Auto-repair failed - issues still present', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Auto-repair failed: ${error.message}`, 'error');
      return false;
    } finally {
      this.repairInProgress = false;
    }
  }

  startWatching() {
    if (this.isWatching) {
      this.log('Already watching', 'warning');
      return;
    }
    
    this.isWatching = true;
    this.log('Starting dependency monitoring...');
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic checks
    this.setupPeriodicChecks();
    
    // Set up file system watchers
    this.setupFileWatchers();
    
    this.log('Dependency monitoring active');
  }

  setupPeriodicChecks() {
    // Check every 30 seconds
    const intervalId = setInterval(() => {
      if (!this.isWatching) return;
      
      this.performHealthCheck();
    }, 30000);
    
    this.watchTimers.set('periodic', intervalId);
  }

  setupFileWatchers() {
    // Watch node_modules directory
    const nodeModulesPath = join(process.cwd(), 'node_modules');
    
    if (existsSync(nodeModulesPath)) {
      try {
        const watcher = watch(nodeModulesPath, { recursive: false }, (eventType, filename) => {
          if (filename && this.criticalPaths.some(path => path.includes(filename))) {
            this.log(`Detected change in ${filename}`, 'warning');
            
            // Debounce checks
            clearTimeout(this.watchTimers.get('debounce'));
            this.watchTimers.set('debounce', setTimeout(() => {
              this.performHealthCheck();
            }, 2000));
          }
        });
        
        this.watchTimers.set('nodeModulesWatcher', watcher);
      } catch (error) {
        this.log(`Failed to watch node_modules: ${error.message}`, 'warning');
      }
    }
  }

  performHealthCheck() {
    const pathsOk = this.checkCriticalPaths();
    const firebaseOk = this.checkFirebaseIntegrity();
    
    if (!pathsOk || !firebaseOk) {
      this.log('Health check failed - attempting repair', 'warning');
      this.autoRepair();
    }
  }

  stop() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    this.log('Stopping dependency monitoring...');
    
    // Clear all timers and watchers
    this.watchTimers.forEach((timer, key) => {
      if (key.includes('Watcher')) {
        timer.close();
      } else {
        clearTimeout(timer);
        clearInterval(timer);
      }
    });
    
    this.watchTimers.clear();
    this.log('Dependency monitoring stopped');
  }
}

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function createProtectedStartupScript() {
  const startupScript = `#!/usr/bin/env node

/**
 * Protected Development Server
 * Auto-generated startup script with full protection
 */

import { spawn } from 'child_process';
import { DependencyWatchdog } from './scripts/dependency-watchdog.js';

async function startProtectedServer() {
  console.log('🛡️  Starting Protected Development Server\\n');
  
  // Start dependency watchdog
  const watchdog = new DependencyWatchdog();
  watchdog.startWatching();
  
  // Wait a moment for initial health check
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Start the actual server
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('Server error:', error.message);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    console.log(\`Server exited with code \${code}\`);
    watchdog.stop();
    process.exit(code);
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\\nShutting down...');
    watchdog.stop();
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\\nShutting down...');
    watchdog.stop();
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

startProtectedServer().catch(console.error);
`;
  
  const scriptPath = join(process.cwd(), 'protected-dev-server.mjs');
  writeFileSync(scriptPath, startupScript);
  log('Protected startup script created');
  
  return scriptPath;
}

function createAutoRepairService() {
  const repairScript = `#!/usr/bin/env node

/**
 * Auto-Repair Service
 * Standalone service that can fix common issues
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

function repairFirebase() {
  console.log('🔧 Auto-repairing Firebase...');
  
  try {
    // Clear npm cache
    execSync('npm cache clean --force', { stdio: 'inherit' });
    
    // Remove and reinstall Firebase
    execSync('npm uninstall firebase', { stdio: 'inherit' });
    execSync('npm install firebase@latest', { stdio: 'inherit' });
    
    console.log('✅ Firebase auto-repair completed');
    return true;
  } catch (error) {
    console.error('❌ Firebase auto-repair failed:', error.message);
    return false;
  }
}

function repairAllDependencies() {
  console.log('🔧 Auto-repairing all dependencies...');
  
  try {
    // Remove node_modules and package-lock.json
    execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
    
    // Fresh install
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ Full dependency repair completed');
    return true;
  } catch (error) {
    console.error('❌ Full dependency repair failed:', error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--firebase')) {
    repairFirebase();
  } else if (args.includes('--full')) {
    repairAllDependencies();
  } else {
    console.log('Usage:');
    console.log('  node auto-repair.mjs --firebase   # Repair Firebase specifically');
    console.log('  node auto-repair.mjs --full       # Full dependency repair');
  }
}

main();
`;
  
  const repairPath = join(process.cwd(), 'auto-repair.mjs');
  writeFileSync(repairPath, repairScript);
  log('Auto-repair service created');
  
  return repairPath;
}

function createDependencyLockdown() {
  const lockdownScript = `#!/usr/bin/env node

/**
 * Dependency Lockdown
 * Ensures dependencies are exactly as expected
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function lockdownDependencies() {
  console.log('🔒 Locking down dependencies...');
  
  try {
    // Create npm-shrinkwrap.json for exact versions
    execSync('npm shrinkwrap', { stdio: 'inherit' });
    
    // Create dependency snapshot
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const snapshot = {
      timestamp: new Date().toISOString(),
      dependencies: packageJson.dependencies,
      devDependencies: packageJson.devDependencies,
      nodeVersion: process.version
    };
    
    writeFileSync('.dependency-snapshot.json', JSON.stringify(snapshot, null, 2));
    
    console.log('✅ Dependencies locked down successfully');
  } catch (error) {
    console.error('❌ Lockdown failed:', error.message);
  }
}

lockdownDependencies();
`;
  
  const lockdownPath = join(process.cwd(), 'dependency-lockdown.mjs');
  writeFileSync(lockdownPath, lockdownScript);
  log('Dependency lockdown script created');
  
  return lockdownPath;
}

async function main() {
  console.log('🚀 Enhanced Development Server Wrapper Starting...\n');
  
  // Create all protective systems
  const protectedScript = createProtectedStartupScript();
  const repairService = createAutoRepairService();
  const lockdownScript = createDependencyLockdown();
  
  // Start the protected server
  log('Starting protected development server...');
  
  const serverProcess = spawn('node', [protectedScript], {
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    log(`Server error: ${error.message}`, 'error');
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    log('Shutting down enhanced server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Shutting down enhanced server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main().catch(console.error);
}