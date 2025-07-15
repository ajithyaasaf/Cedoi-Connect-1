#!/usr/bin/env node

/**
 * Development Setup Script
 * Ensures the development environment is properly configured
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { runHealthCheck, autoFix } from './check-dependencies.js';

function ensureEnvironmentFile() {
  const envPath = '.env';
  const envExamplePath = '.env.example';
  
  if (!existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    
    const envContent = `# Firebase Configuration (Optional - will use mock data if not provided)
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
    
    writeFileSync(envPath, envContent);
    console.log('✅ .env file created with default values');
  } else {
    console.log('✅ .env file already exists');
  }
  
  // Create example file for reference
  if (!existsSync(envExamplePath)) {
    writeFileSync(envExamplePath, `# Copy this file to .env and fill in your Firebase credentials
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
`);
    console.log('✅ .env.example file created');
  }
}

function setupGitignore() {
  const gitignorePath = '.gitignore';
  const requiredEntries = [
    'node_modules/',
    '.env',
    '.env.local',
    'dist/',
    '.vite/',
    '*.log',
    '.DS_Store'
  ];
  
  let gitignoreContent = '';
  
  if (existsSync(gitignorePath)) {
    gitignoreContent = require('fs').readFileSync(gitignorePath, 'utf8');
  }
  
  const missingEntries = requiredEntries.filter(entry => 
    !gitignoreContent.includes(entry)
  );
  
  if (missingEntries.length > 0) {
    console.log('📝 Updating .gitignore...');
    const newContent = gitignoreContent + '\n' + missingEntries.join('\n') + '\n';
    writeFileSync(gitignorePath, newContent);
    console.log('✅ .gitignore updated');
  } else {
    console.log('✅ .gitignore is up to date');
  }
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`📦 npm version: ${npmVersion}`);
    
    // Check if npm is recent enough
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    if (majorVersion < 8) {
      console.warn('⚠️  npm version is outdated. Consider upgrading.');
    }
  } catch (error) {
    console.error('❌ Failed to check npm version:', error.message);
  }
}

async function main() {
  console.log('🚀 Setting up development environment...\n');
  
  // Check system requirements
  checkNpmVersion();
  
  // Setup environment files
  ensureEnvironmentFile();
  setupGitignore();
  
  // Check and fix dependencies
  console.log('\n🔍 Checking dependencies...');
  const healthy = runHealthCheck();
  
  if (!healthy) {
    console.log('\n🔧 Fixing dependency issues...');
    const fixed = autoFix();
    
    if (!fixed) {
      console.error('\n❌ Failed to fix dependency issues');
      process.exit(1);
    }
  }
  
  console.log('\n✅ Development environment setup complete!');
  console.log('\n🎯 Next steps:');
  console.log('  1. Configure Firebase credentials in .env (optional)');
  console.log('  2. Run: npm run dev');
  console.log('  3. Open http://localhost:5000');
}

main().catch(console.error);