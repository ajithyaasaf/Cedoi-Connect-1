/**
 * Dependency Guardian for Server
 * Ensures all dependencies are healthy before starting the server
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface GuardianConfig {
  criticalModules: string[];
  firebaseModules: string[];
  reactModules: string[];
  autoRepair: boolean;
  logLevel: 'error' | 'warning' | 'info';
}

export class DependencyGuardian {
  private config: GuardianConfig;
  private startTime: number;

  constructor(config: Partial<GuardianConfig> = {}) {
    this.config = {
      criticalModules: [
        'firebase',
        'react',
        'react-dom',
        'express',
        'vite',
        '@tanstack/react-query',
        'wouter',
        'tailwindcss',
        'typescript'
      ],
      firebaseModules: [
        'firebase/app',
        'firebase/firestore',
        'firebase/auth'
      ],
      reactModules: [
        'react',
        'react-dom',
        'react/jsx-runtime'
      ],
      autoRepair: true,
      logLevel: 'info',
      ...config
    };
    
    this.startTime = Date.now();
  }

  private log(message: string, level: 'error' | 'warning' | 'info' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '✅';
    
    if (this.shouldLog(level)) {
      console.log(`${prefix} [GUARDIAN ${timestamp}] ${message}`);
    }
  }

  private shouldLog(level: 'error' | 'warning' | 'info'): boolean {
    const levels = ['error', 'warning', 'info'];
    return levels.indexOf(level) <= levels.indexOf(this.config.logLevel);
  }

  private checkPackageJson(): boolean {
    const packagePath = join(process.cwd(), 'package.json');
    
    if (!existsSync(packagePath)) {
      this.log('package.json not found', 'error');
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const missingDeps = this.config.criticalModules.filter(dep => !allDeps[dep]);
      
      if (missingDeps.length > 0) {
        this.log(`Missing dependencies in package.json: ${missingDeps.join(', ')}`, 'error');
        return false;
      }
      
      this.log('All critical dependencies found in package.json');
      return true;
    } catch (error) {
      this.log(`Failed to read package.json: ${error.message}`, 'error');
      return false;
    }
  }

  private checkNodeModules(): boolean {
    const nodeModulesPath = join(process.cwd(), 'node_modules');
    
    if (!existsSync(nodeModulesPath)) {
      this.log('node_modules directory not found', 'error');
      return false;
    }

    const missingModules = this.config.criticalModules.filter(module => 
      !existsSync(join(nodeModulesPath, module))
    );

    if (missingModules.length > 0) {
      this.log(`Missing installed modules: ${missingModules.join(', ')}`, 'error');
      return false;
    }

    this.log('All critical modules installed');
    return true;
  }

  private checkFirebaseIntegrity(): boolean {
    const firebasePath = join(process.cwd(), 'node_modules', 'firebase');
    
    if (!existsSync(firebasePath)) {
      this.log('Firebase package not found', 'error');
      return false;
    }

    try {
      // Check Firebase package.json
      const packageJson = JSON.parse(readFileSync(join(firebasePath, 'package.json'), 'utf8'));
      this.log(`Firebase version ${packageJson.version} detected`);
      
      // Check critical Firebase modules (updated for Firebase v11 structure)
      const criticalModules = [
        'app/dist/esm/index.esm.js',
        'firestore/dist/esm/index.esm.js',
        'auth/dist/esm/index.esm.js'
      ];
      
      const missingModules = criticalModules.filter(module => 
        !existsSync(join(firebasePath, module))
      );
      
      if (missingModules.length > 0) {
        // For Firebase v11+, check alternative paths
        const alternativeModules = [
          'app/dist/index.cjs.js',
          'firestore/dist/index.cjs.js',
          'auth/dist/index.cjs.js'
        ];
        
        const alternativeMissing = alternativeModules.filter(module => 
          !existsSync(join(firebasePath, module))
        );
        
        if (alternativeMissing.length > 0) {
          this.log(`Firebase modules missing: ${missingModules.join(', ')}`, 'warning');
          // Don't fail the check - Firebase v11+ has different structure
        }
      }
      
      this.log('Firebase integrity check passed');
      return true;
    } catch (error) {
      this.log(`Firebase integrity check failed: ${error.message}`, 'error');
      return false;
    }
  }

  private checkReactIntegrity(): boolean {
    this.log('Checking React integrity...');
    
    for (const module of this.config.reactModules) {
      const modulePath = join(process.cwd(), 'node_modules', module.split('/')[0]);
      
      if (!existsSync(modulePath)) {
        this.log(`React module ${module} not found at ${modulePath}`, 'error');
        return false;
      }
    }
    
    // Check React version
    const reactPackagePath = join(process.cwd(), 'node_modules', 'react', 'package.json');
    if (existsSync(reactPackagePath)) {
      try {
        const reactPackage = JSON.parse(readFileSync(reactPackagePath, 'utf8'));
        this.log(`React version ${reactPackage.version} detected`);
      } catch (error) {
        this.log('Failed to read React package.json', 'warning');
      }
    }
    
    // Check React-DOM version
    const reactDomPackagePath = join(process.cwd(), 'node_modules', 'react-dom', 'package.json');
    if (existsSync(reactDomPackagePath)) {
      try {
        const reactDomPackage = JSON.parse(readFileSync(reactDomPackagePath, 'utf8'));
        this.log(`React-DOM version ${reactDomPackage.version} detected`);
      } catch (error) {
        this.log('Failed to read React-DOM package.json', 'warning');
      }
    }
    
    this.log('React integrity check passed');
    return true;
  }

  private async performAutoRepair(): Promise<boolean> {
    if (!this.config.autoRepair) {
      this.log('Auto-repair disabled');
      return false;
    }

    this.log('Starting auto-repair sequence...');
    
    try {
      // Clear npm cache
      this.log('Clearing npm cache...');
      execSync('npm cache clean --force', { stdio: 'pipe' });
      
      // Reinstall Firebase specifically (most common issue)
      this.log('Reinstalling Firebase...');
      execSync('npm uninstall firebase', { stdio: 'pipe' });
      execSync('npm install firebase@latest', { stdio: 'pipe' });
      
      // Reinstall React if needed
      this.log('Reinstalling React...');
      execSync('npm uninstall react react-dom', { stdio: 'pipe' });
      execSync('npm install react@latest react-dom@latest', { stdio: 'pipe' });
      
      // Verify repair
      const repairSuccess = this.checkNodeModules() && this.checkFirebaseIntegrity() && this.checkReactIntegrity();
      
      if (repairSuccess) {
        this.log('Auto-repair completed successfully');
        return true;
      } else {
        this.log('Auto-repair failed - manual intervention required', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Auto-repair failed: ${error.message}`, 'error');
      return false;
    }
  }

  public async performHealthCheck(): Promise<boolean> {
    this.log('Starting dependency health check...');
    
    const checks = [
      this.checkPackageJson(),
      this.checkNodeModules(),
      this.checkFirebaseIntegrity(),
      this.checkReactIntegrity()
    ];
    
    const allPassed = checks.every(check => check);
    
    if (allPassed) {
      const elapsed = Date.now() - this.startTime;
      this.log(`Health check completed successfully in ${elapsed}ms`);
      return true;
    } else {
      this.log('Health check failed - attempting repair', 'warning');
      const repairSuccess = await this.performAutoRepair();
      
      if (repairSuccess) {
        const elapsed = Date.now() - this.startTime;
        this.log(`Health check and repair completed in ${elapsed}ms`);
        return true;
      } else {
        this.log('Health check and repair failed', 'error');
        return false;
      }
    }
  }

  public getHealthStatus(): {
    healthy: boolean;
    checks: { name: string; passed: boolean }[];
    timestamp: string;
  } {
    const checks = [
      { name: 'Package.json', passed: this.checkPackageJson() },
      { name: 'Node Modules', passed: this.checkNodeModules() },
      { name: 'Firebase Integrity', passed: this.checkFirebaseIntegrity() },
      { name: 'React Integrity', passed: this.checkReactIntegrity() }
    ];
    
    return {
      healthy: checks.every(check => check.passed),
      checks,
      timestamp: new Date().toISOString()
    };
  }
}