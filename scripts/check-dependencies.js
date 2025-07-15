#!/usr/bin/env node

/**
 * Dependency Health Check Script
 * Ensures all critical dependencies are properly installed and available
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const CRITICAL_DEPENDENCIES = [
  'firebase',
  'react',
  'react-dom',
  'express',
  'wouter',
  '@tanstack/react-query',
  'tailwindcss',
  'typescript',
  'vite'
];

const FIREBASE_MODULES = [
  'firebase/app',
  'firebase/firestore',
  'firebase/auth'
];

function checkPackageJson() {
  const packagePath = join(process.cwd(), 'package.json');
  if (!existsSync(packagePath)) {
    console.error('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const missing = CRITICAL_DEPENDENCIES.filter(dep => !allDeps[dep]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing critical dependencies: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ All critical dependencies listed in package.json');
  return true;
}

function checkNodeModules() {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    console.error('❌ node_modules directory not found');
    return false;
  }

  const missing = CRITICAL_DEPENDENCIES.filter(dep => 
    !existsSync(join(nodeModulesPath, dep))
  );

  if (missing.length > 0) {
    console.error(`❌ Missing installed dependencies: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ All critical dependencies installed in node_modules');
  return true;
}

function checkFirebaseModules() {
  const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
  if (!existsSync(firebasePath)) {
    console.error('❌ Firebase not installed');
    return false;
  }

  // Check if Firebase modules can be resolved
  try {
    const packageJson = JSON.parse(readFileSync(join(firebasePath, 'package.json'), 'utf8'));
    console.log(`✅ Firebase version ${packageJson.version} installed`);
    
    // Check for specific Firebase modules
    const firebaseDistPath = join(firebasePath, 'dist');
    if (existsSync(firebaseDistPath)) {
      console.log('✅ Firebase distribution files present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase installation corrupted:', error.message);
    return false;
  }
}

function checkLockfile() {
  const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  const existingLockfile = lockfiles.find(file => existsSync(join(process.cwd(), file)));
  
  if (!existingLockfile) {
    console.warn('⚠️  No lockfile found - dependencies may be inconsistent');
    return false;
  }
  
  console.log(`✅ Lockfile present: ${existingLockfile}`);
  return true;
}

function runHealthCheck() {
  console.log('🔍 Running dependency health check...\n');
  
  const checks = [
    checkPackageJson(),
    checkNodeModules(),
    checkFirebaseModules(),
    checkLockfile()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    console.log('\n✅ All dependency checks passed!');
    return true;
  } else {
    console.log('\n❌ Some dependency checks failed');
    return false;
  }
}

function autoFix() {
  console.log('\n🔧 Attempting to fix dependency issues...');
  
  try {
    // Clear npm cache
    console.log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Run health check again
    console.log('\n🔍 Re-running health check...');
    return runHealthCheck();
  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message);
    return false;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const healthy = runHealthCheck();
  
  if (!healthy) {
    const autoFixSuccess = autoFix();
    process.exit(autoFixSuccess ? 0 : 1);
  }
}

export { runHealthCheck, autoFix };