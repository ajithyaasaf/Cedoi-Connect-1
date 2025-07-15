#!/usr/bin/env node

/**
 * Firebase Health Check Script
 * Specifically monitors Firebase module integrity and import resolution
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkFirebasePackage() {
  log('Checking Firebase package integrity...');
  
  const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
  
  if (!existsSync(firebasePath)) {
    log('Firebase package not found', 'error');
    return false;
  }
  
  // Check package.json
  const packageJsonPath = join(firebasePath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    log('Firebase package.json missing', 'error');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    log(`Firebase package version: ${packageJson.version}`);
    
    // Check main entry point
    if (packageJson.main && !existsSync(join(firebasePath, packageJson.main))) {
      log(`Main entry point missing: ${packageJson.main}`, 'error');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`Failed to read Firebase package.json: ${error.message}`, 'error');
    return false;
  }
}

function checkFirebaseModules() {
  log('Checking Firebase submodules...');
  
  const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
  const requiredModules = [
    'app',
    'firestore',
    'auth'
  ];
  
  const missingModules = [];
  
  for (const module of requiredModules) {
    const modulePath = join(firebasePath, module);
    if (!existsSync(modulePath)) {
      missingModules.push(module);
      continue;
    }
    
    // Check if module has dist folder
    const distPath = join(modulePath, 'dist');
    if (!existsSync(distPath)) {
      log(`${module} dist folder missing`, 'warning');
    }
    
    // Check package.json for module
    const modulePackageJson = join(modulePath, 'package.json');
    if (existsSync(modulePackageJson)) {
      try {
        const modulePackage = JSON.parse(readFileSync(modulePackageJson, 'utf8'));
        log(`Firebase ${module} version: ${modulePackage.version}`);
      } catch (error) {
        log(`Failed to read ${module} package.json`, 'warning');
      }
    }
  }
  
  if (missingModules.length > 0) {
    log(`Missing Firebase modules: ${missingModules.join(', ')}`, 'error');
    return false;
  }
  
  log('All Firebase modules present');
  return true;
}

function testFirebaseImports() {
  log('Testing Firebase imports...');
  
  const testScript = `
    import { initializeApp } from 'firebase/app';
    import { getFirestore } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';
    
    console.log('Firebase imports successful');
  `;
  
  try {
    // Create a temporary test file
    const testFile = join(process.cwd(), 'temp-firebase-test.mjs');
    require('fs').writeFileSync(testFile, testScript);
    
    // Try to run the test
    execSync(`node ${testFile}`, { stdio: 'pipe' });
    
    // Clean up
    require('fs').unlinkSync(testFile);
    
    log('Firebase imports test passed');
    return true;
  } catch (error) {
    log(`Firebase imports test failed: ${error.message}`, 'error');
    
    // Clean up test file if it exists
    const testFile = join(process.cwd(), 'temp-firebase-test.mjs');
    if (existsSync(testFile)) {
      require('fs').unlinkSync(testFile);
    }
    
    return false;
  }
}

function checkFirebaseConfig() {
  log('Checking Firebase configuration...');
  
  const configPath = join(process.cwd(), 'client', 'src', 'lib', 'firebase.ts');
  if (!existsSync(configPath)) {
    log('Firebase config file not found', 'error');
    return false;
  }
  
  try {
    const configContent = readFileSync(configPath, 'utf8');
    
    // Check for required imports
    const requiredImports = [
      'initializeApp',
      'getFirestore',
      'getAuth'
    ];
    
    const missingImports = requiredImports.filter(imp => 
      !configContent.includes(imp)
    );
    
    if (missingImports.length > 0) {
      log(`Missing Firebase imports: ${missingImports.join(', ')}`, 'warning');
    }
    
    // Check for configuration object
    if (!configContent.includes('firebaseConfig')) {
      log('Firebase config object not found', 'warning');
    }
    
    log('Firebase configuration file looks good');
    return true;
  } catch (error) {
    log(`Failed to read Firebase config: ${error.message}`, 'error');
    return false;
  }
}

function repairFirebase() {
  log('Attempting to repair Firebase installation...');
  
  try {
    // Remove Firebase specifically
    log('Removing Firebase package...');
    execSync('npm uninstall firebase', { stdio: 'pipe' });
    
    // Clear npm cache
    log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'pipe' });
    
    // Reinstall Firebase
    log('Reinstalling Firebase...');
    execSync('npm install firebase@latest', { stdio: 'inherit' });
    
    // Verify installation
    log('Verifying Firebase installation...');
    execSync('npm ls firebase', { stdio: 'pipe' });
    
    log('Firebase repair completed successfully');
    return true;
  } catch (error) {
    log(`Firebase repair failed: ${error.message}`, 'error');
    return false;
  }
}

function main() {
  console.log('🔥 Firebase Health Check Starting...\n');
  
  const checks = [
    checkFirebasePackage(),
    checkFirebaseModules(),
    checkFirebaseConfig(),
    testFirebaseImports()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    console.log('\n✅ Firebase health check passed!');
    return true;
  } else {
    console.log('\n❌ Firebase health check failed. Attempting repair...\n');
    
    const repairSuccess = repairFirebase();
    
    if (repairSuccess) {
      console.log('\n✅ Firebase repair completed successfully!');
      
      // Run checks again
      console.log('\n🔍 Re-running health checks...\n');
      const recheckResults = [
        checkFirebasePackage(),
        checkFirebaseModules(),
        checkFirebaseConfig(),
        testFirebaseImports()
      ];
      
      const allPassedAfterRepair = recheckResults.every(check => check);
      
      if (allPassedAfterRepair) {
        console.log('\n✅ All Firebase checks passed after repair!');
        return true;
      } else {
        console.log('\n❌ Some checks still failing after repair');
        return false;
      }
    } else {
      console.log('\n❌ Firebase repair failed. Manual intervention required.');
      return false;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = main();
  process.exit(success ? 0 : 1);
}

export { main as firebaseHealthCheck };