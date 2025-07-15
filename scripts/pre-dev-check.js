#!/usr/bin/env node

/**
 * Pre-Development Check Script
 * Runs before starting the development server to ensure everything is ready
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Critical dependencies that must be present
const CRITICAL_DEPENDENCIES = [
  'firebase',
  'react',
  'react-dom',
  'express',
  'wouter',
  '@tanstack/react-query',
  'tailwindcss',
  'typescript',
  'vite',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  'lucide-react'
];

// Firebase specific modules to check
const FIREBASE_MODULES = [
  'firebase/app',
  'firebase/firestore',
  'firebase/auth'
];

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkCriticalDependencies() {
  log('Checking critical dependencies...');
  
  const packagePath = join(process.cwd(), 'package.json');
  if (!existsSync(packagePath)) {
    log('package.json not found', 'error');
    return false;
  }

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const missing = CRITICAL_DEPENDENCIES.filter(dep => !allDeps[dep]);
  
  if (missing.length > 0) {
    log(`Missing dependencies in package.json: ${missing.join(', ')}`, 'error');
    return false;
  }
  
  log('All critical dependencies found in package.json');
  return true;
}

function checkNodeModules() {
  log('Checking node_modules installation...');
  
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    log('node_modules directory not found', 'error');
    return false;
  }

  const missingModules = CRITICAL_DEPENDENCIES.filter(dep => 
    !existsSync(join(nodeModulesPath, dep))
  );

  if (missingModules.length > 0) {
    log(`Missing installed modules: ${missingModules.join(', ')}`, 'error');
    return false;
  }

  log('All critical modules installed');
  return true;
}

function checkFirebaseInstallation() {
  log('Checking Firebase installation...');
  
  const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
  if (!existsSync(firebasePath)) {
    log('Firebase module not found', 'error');
    return false;
  }

  try {
    // Check Firebase package.json
    const firebasePackageJson = JSON.parse(
      readFileSync(join(firebasePath, 'package.json'), 'utf8')
    );
    
    log(`Firebase version ${firebasePackageJson.version} installed`);
    
    // Check if main files exist
    const mainFiles = ['dist/index.js', 'firestore/dist/index.js', 'auth/dist/index.js'];
    const missingFiles = mainFiles.filter(file => 
      !existsSync(join(firebasePath, file))
    );
    
    if (missingFiles.length > 0) {
      log(`Firebase files missing: ${missingFiles.join(', ')}`, 'warning');
      // Not critical, but worth noting
    }
    
    return true;
  } catch (error) {
    log(`Firebase installation check failed: ${error.message}`, 'error');
    return false;
  }
}

function checkTypeScriptSetup() {
  log('Checking TypeScript setup...');
  
  const tsconfigPath = join(process.cwd(), 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    log('tsconfig.json not found', 'warning');
    return false;
  }

  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
    
    // Check for essential TypeScript configuration
    if (!tsconfig.compilerOptions) {
      log('No compiler options in tsconfig.json', 'warning');
      return false;
    }
    
    const requiredOptions = ['moduleResolution', 'jsx', 'target'];
    const missingOptions = requiredOptions.filter(opt => 
      !tsconfig.compilerOptions[opt]
    );
    
    if (missingOptions.length > 0) {
      log(`Missing TypeScript options: ${missingOptions.join(', ')}`, 'warning');
    }
    
    log('TypeScript configuration looks good');
    return true;
  } catch (error) {
    log(`TypeScript config check failed: ${error.message}`, 'error');
    return false;
  }
}

function checkViteSetup() {
  log('Checking Vite setup...');
  
  const viteConfigPath = join(process.cwd(), 'vite.config.ts');
  if (!existsSync(viteConfigPath)) {
    log('vite.config.ts not found', 'error');
    return false;
  }

  log('Vite configuration file exists');
  return true;
}

function autoRepair() {
  log('Attempting automatic repair...');
  
  try {
    // Clear npm cache
    log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'pipe' });
    
    // Remove node_modules and reinstall
    log('Removing node_modules...');
    execSync('rm -rf node_modules', { stdio: 'pipe' });
    
    log('Reinstalling dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Verify Firebase specifically
    log('Verifying Firebase installation...');
    execSync('npm ls firebase', { stdio: 'pipe' });
    
    log('Automatic repair completed successfully');
    return true;
  } catch (error) {
    log(`Automatic repair failed: ${error.message}`, 'error');
    return false;
  }
}

function main() {
  console.log('🔍 Pre-development checks starting...\n');
  
  const checks = [
    checkCriticalDependencies(),
    checkNodeModules(),
    checkFirebaseInstallation(),
    checkTypeScriptSetup(),
    checkViteSetup()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    console.log('\n✅ All pre-development checks passed!');
    console.log('🚀 Ready to start development server...\n');
    return true;
  } else {
    console.log('\n❌ Some checks failed. Attempting repair...\n');
    
    const repairSuccess = autoRepair();
    
    if (repairSuccess) {
      console.log('\n✅ Repair completed successfully!');
      console.log('🚀 Ready to start development server...\n');
      return true;
    } else {
      console.log('\n❌ Repair failed. Manual intervention required.');
      console.log('💡 Try running: npm install');
      return false;
    }
  }
}

// Run the checks
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = main();
  process.exit(success ? 0 : 1);
}

export { main as preDevCheck };